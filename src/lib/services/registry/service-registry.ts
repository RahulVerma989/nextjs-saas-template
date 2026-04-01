import { ServiceRun } from '@/lib/db/models/service-run.model';
import { connectDB } from '@/lib/db/connection';
import { getRedisClient, isRedisConnected } from '@/lib/cache/redis-client';
import { generateUUID7 } from '@/lib/utils/uuid';
import { CacheKeys } from '@/lib/cache/keys';

export type TriggerType = 'schedule' | 'manual' | 'webhook' | 'api';

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  /** Cron expression for scheduled execution (e.g., '*/5 * * * *' for every 5 min) */
  schedule?: string;
  /** Whether to allow concurrent runs of this service */
  allowConcurrent?: boolean;
  /** Lock TTL in seconds (default: 300) */
  lockTTL?: number;
  /** The actual service handler */
  handler: (context: ServiceContext) => Promise<unknown>;
  /** Whether the service is enabled */
  enabled?: boolean;
}

export interface ServiceContext {
  serviceId: string;
  runId: string;
  triggeredBy: TriggerType;
  metadata?: Record<string, unknown>;
  log: (message: string) => void;
}

class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  register(definition: ServiceDefinition): void {
    if (this.services.has(definition.id)) {
      console.warn(`[ServiceRegistry] Service '${definition.id}' already registered, overwriting`);
    }
    this.services.set(definition.id, { enabled: true, allowConcurrent: false, lockTTL: 300, ...definition });
    console.log(`[ServiceRegistry] Registered: ${definition.id} (${definition.name})`);
  }

  getService(id: string): ServiceDefinition | undefined {
    return this.services.get(id);
  }

  listServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  /**
   * Acquire a distributed lock for a service run using Redis
   */
  private async acquireLock(serviceId: string, ttlSeconds: number): Promise<boolean> {
    if (!isRedisConnected()) return true; // Fail open if Redis unavailable

    try {
      const redis = getRedisClient();
      const lockKey = CacheKeys.serviceLock(serviceId);
      const result = await redis.set(lockKey, Date.now().toString(), 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (error) {
      console.warn(`[ServiceRegistry] Lock acquisition failed for ${serviceId}:`, error);
      return true; // Fail open
    }
  }

  private async releaseLock(serviceId: string): Promise<void> {
    if (!isRedisConnected()) return;

    try {
      const redis = getRedisClient();
      const lockKey = CacheKeys.serviceLock(serviceId);
      await redis.del(lockKey);
    } catch (error) {
      console.warn(`[ServiceRegistry] Lock release failed for ${serviceId}:`, error);
    }
  }

  /**
   * Execute a service by ID
   */
  async execute(
    serviceId: string,
    triggeredBy: TriggerType = 'manual',
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; runId?: string; error?: string }> {
    const service = this.services.get(serviceId);
    if (!service) {
      return { success: false, error: `Service '${serviceId}' not found` };
    }

    if (!service.enabled) {
      return { success: false, error: `Service '${serviceId}' is disabled` };
    }

    // Distributed lock
    if (!service.allowConcurrent) {
      const lockAcquired = await this.acquireLock(serviceId, service.lockTTL!);
      if (!lockAcquired) {
        return { success: false, error: `Service '${serviceId}' is already running` };
      }
    }

    const runId = generateUUID7();
    const startedAt = new Date();
    const logs: string[] = [];

    try {
      await connectDB();

      // Record the run
      await ServiceRun.create({
        _id: runId,
        serviceId,
        status: 'running',
        triggeredBy,
        startedAt,
        metadata,
      });

      const context: ServiceContext = {
        serviceId,
        runId,
        triggeredBy,
        metadata,
        log: (message: string) => {
          logs.push(`[${new Date().toISOString()}] ${message}`);
          console.log(`[Service:${serviceId}] ${message}`);
        },
      };

      const result = await service.handler(context);
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      await ServiceRun.findByIdAndUpdate(runId, {
        status: 'completed',
        completedAt,
        duration,
        result: { output: result, logs },
      });

      return { success: true, runId };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      await ServiceRun.findByIdAndUpdate(runId, {
        status: 'failed',
        completedAt,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        result: { logs },
      }).catch(() => {}); // Don't throw on logging failure

      console.error(`[ServiceRegistry] Service '${serviceId}' failed:`, error);
      return { success: false, runId, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      if (!service.allowConcurrent) {
        await this.releaseLock(serviceId);
      }
    }
  }

  /**
   * Start all scheduled services
   */
  startScheduled(): void {
    for (const [id, service] of this.services) {
      if (!service.schedule || !service.enabled) continue;

      const intervalMs = this.cronToMs(service.schedule);
      if (!intervalMs) {
        console.warn(`[ServiceRegistry] Invalid schedule for ${id}: ${service.schedule}`);
        continue;
      }

      const interval = setInterval(() => {
        this.execute(id, 'schedule').catch((err) => {
          console.error(`[ServiceRegistry] Scheduled execution failed for ${id}:`, err);
        });
      }, intervalMs);

      this.intervals.set(id, interval);
      console.log(`[ServiceRegistry] Scheduled '${id}' every ${intervalMs / 1000}s`);
    }
  }

  /**
   * Stop all scheduled services
   */
  stopScheduled(): void {
    for (const [id, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`[ServiceRegistry] Stopped scheduled service: ${id}`);
    }
    this.intervals.clear();
  }

  /**
   * Simple cron-to-ms conversion for common patterns
   * Supports: seconds-based (*/N * * * * *) and minutes-based (*/N * * * *)
   * For complex cron, use Agenda.js instead
   */
  private cronToMs(cron: string): number | null {
    const parts = cron.trim().split(/\s+/);

    // Simple interval patterns
    if (parts.length === 5) {
      // Standard 5-field cron
      const minutePart = parts[0];
      if (minutePart.startsWith('*/')) {
        const minutes = parseInt(minutePart.slice(2), 10);
        if (!isNaN(minutes) && minutes > 0) return minutes * 60 * 1000;
      }
      // Hourly: 0 * * * *
      if (minutePart === '0' && parts[1] === '*') return 60 * 60 * 1000;
    }

    if (parts.length === 6) {
      // 6-field with seconds
      const secondPart = parts[0];
      if (secondPart.startsWith('*/')) {
        const seconds = parseInt(secondPart.slice(2), 10);
        if (!isNaN(seconds) && seconds > 0) return seconds * 1000;
      }
    }

    return null;
  }
}

// Singleton
let registryInstance: ServiceRegistry | null = null;

export function getServiceRegistry(): ServiceRegistry {
  if (!registryInstance) {
    registryInstance = new ServiceRegistry();
  }
  return registryInstance;
}

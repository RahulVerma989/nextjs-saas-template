import { getServiceRegistry } from '../registry/service-registry';
import type { ServiceContext } from '../registry/service-registry';

/**
 * Example background service definition.
 * Copy this file and modify to create your own services.
 *
 * Services are registered with the ServiceRegistry and can be:
 * - Scheduled (via cron expression)
 * - Triggered manually via API
 * - Triggered via webhook
 */
export function registerExampleService(): void {
  const registry = getServiceRegistry();

  registry.register({
    id: 'example-health-check',
    name: 'Health Check',
    description: 'Periodically checks system health and logs status',
    schedule: '*/5 * * * *', // Every 5 minutes
    allowConcurrent: false,
    lockTTL: 60,
    enabled: false, // Set to true to enable
    handler: async (ctx: ServiceContext) => {
      ctx.log('Starting health check...');

      // Example: check database connectivity
      const { isConnected } = await import('@/lib/db/connection');
      const dbHealthy = isConnected();
      ctx.log(`Database: ${dbHealthy ? 'healthy' : 'unhealthy'}`);

      // Example: check Redis connectivity
      const { isRedisConnected } = await import('@/lib/cache/redis-client');
      const redisHealthy = isRedisConnected();
      ctx.log(`Redis: ${redisHealthy ? 'healthy' : 'unhealthy'}`);

      return {
        database: dbHealthy,
        redis: redisHealthy,
        timestamp: new Date().toISOString(),
      };
    },
  });
}

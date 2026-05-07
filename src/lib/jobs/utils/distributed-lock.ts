/**
 * Redis-based Distributed Lock
 *
 * Prevents duplicate processing of jobs across multiple workers.
 * Uses Redis SET NX with expiry for atomic lock acquisition.
 */

import { getRedisClient } from '@/lib/cache/redis-client';

interface LockOptions {
  ttlMs: number; // Lock time-to-live in milliseconds
  retryCount?: number; // Number of retry attempts
  retryDelayMs?: number; // Delay between retries
}

const DEFAULT_OPTIONS: Required<LockOptions> = {
  ttlMs: 60000, // 1 minute default
  retryCount: 3,
  retryDelayMs: 100,
};

/**
 * Distributed Lock Manager using Redis
 */
class DistributedLockManager {
  private redis = getRedisClient();
  private keyPrefix = 'lock:';
  private heldLocks = new Map<string, string>();

  /**
   * Acquire a lock on a resource.
   * Returns true if lock was acquired, false otherwise.
   */
  async acquire(resource: string, options: LockOptions): Promise<boolean> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const key = `${this.keyPrefix}${resource}`;
    const value = this.generateLockValue();

    for (let attempt = 0; attempt <= opts.retryCount; attempt++) {
      try {
        // SET key value PX ttlMs NX  (NX = only set if not exists)
        const result = await this.redis.set(key, value, 'PX', opts.ttlMs, 'NX');

        if (result === 'OK') {
          this.heldLocks.set(resource, value);
          console.log(`[Lock] Acquired: ${resource}`);
          return true;
        }

        if (attempt < opts.retryCount) {
          await new Promise((resolve) => setTimeout(resolve, opts.retryDelayMs));
        }
      } catch (error) {
        console.error(`[Lock] Acquire failed for ${resource}:`, error);
        if (attempt === opts.retryCount) throw error;
      }
    }

    console.log(`[Lock] Failed to acquire: ${resource}`);
    return false;
  }

  /**
   * Release a lock on a resource.  Only releases if we still hold the
   * lock (prevents releasing another process's lock after our TTL
   * expired and someone else picked it up).
   */
  async release(resource: string): Promise<boolean> {
    const key = `${this.keyPrefix}${resource}`;
    const expectedValue = this.heldLocks.get(resource);

    if (!expectedValue) {
      console.warn(`[Lock] Attempted to release unheld lock: ${resource}`);
      return false;
    }

    try {
      // Lua script for atomic check-and-delete.
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(script, 1, key, expectedValue);
      this.heldLocks.delete(resource);

      if (result === 1) {
        console.log(`[Lock] Released: ${resource}`);
        return true;
      }
      console.warn(`[Lock] Lock expired or stolen: ${resource}`);
      return false;
    } catch (error) {
      console.error(`[Lock] Release failed for ${resource}:`, error);
      this.heldLocks.delete(resource);
      return false;
    }
  }

  /** Extend the TTL of a held lock. */
  async extend(resource: string, additionalTtlMs: number): Promise<boolean> {
    const key = `${this.keyPrefix}${resource}`;
    const expectedValue = this.heldLocks.get(resource);

    if (!expectedValue) {
      console.warn(`[Lock] Attempted to extend unheld lock: ${resource}`);
      return false;
    }

    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;
      const result = await this.redis.eval(
        script,
        1,
        key,
        expectedValue,
        additionalTtlMs,
      );
      if (result === 1) {
        console.log(`[Lock] Extended: ${resource} by ${additionalTtlMs}ms`);
        return true;
      }
      console.warn(`[Lock] Extend failed, lock expired: ${resource}`);
      this.heldLocks.delete(resource);
      return false;
    } catch (error) {
      console.error(`[Lock] Extend failed for ${resource}:`, error);
      return false;
    }
  }

  async isLocked(resource: string): Promise<boolean> {
    const key = `${this.keyPrefix}${resource}`;
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`[Lock] Check failed for ${resource}:`, error);
      return false;
    }
  }

  async getTTL(resource: string): Promise<number> {
    const key = `${this.keyPrefix}${resource}`;
    try {
      const ttl = await this.redis.pttl(key);
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      console.error(`[Lock] TTL check failed for ${resource}:`, error);
      return 0;
    }
  }

  /**
   * Execute a function while holding a lock.  Automatically acquires
   * and releases the lock.  Returns null if the lock could not be
   * acquired so the caller can no-op without an error path.
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    options: LockOptions,
  ): Promise<T | null> {
    const acquired = await this.acquire(resource, options);
    if (!acquired) return null;
    try {
      return await fn();
    } finally {
      await this.release(resource);
    }
  }

  /** Release all locks held by this instance — used on graceful shutdown. */
  async releaseAll(): Promise<void> {
    const resources = Array.from(this.heldLocks.keys());
    console.log(`[Lock] Releasing all ${resources.length} locks`);
    await Promise.all(resources.map((resource) => this.release(resource)));
  }

  private generateLockValue(): string {
    return `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

let instance: DistributedLockManager | null = null;

export function getDistributedLock(): DistributedLockManager {
  if (!instance) instance = new DistributedLockManager();
  return instance;
}

export { DistributedLockManager };

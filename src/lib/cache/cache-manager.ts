import { getRedisClient, isRedisConnected } from './redis-client';
import type Redis from 'ioredis';

export class CacheManager {
  private _redis: Redis | null = null;

  private get redis(): Redis | null {
    if (!this._redis) {
      try {
        this._redis = getRedisClient();
      } catch (error) {
        console.warn('[Cache] Failed to initialize Redis client:', error);
        return null;
      }
    }

    if (this._redis && !isRedisConnected()) {
      return null;
    }

    return this._redis;
  }

  isAvailable(): boolean {
    return this._redis !== null && isRedisConnected();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      let cursor = '0';
      let deletedCount = 0;
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');
      return deletedCount;
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds).catch((error) => {
      console.error(`[Cache] Error caching key ${key}:`, error);
    });
    return fresh;
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error checking key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.redis) return -1;
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(`[Cache] Error getting TTL for ${key}:`, error);
      return -1;
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    if (!this.redis) {
      console.warn('[Cache] Redis unavailable, increment operation skipped');
      return 0;
    }
    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    if (!this.redis) {
      console.warn('[Cache] Redis unavailable, decrement operation skipped');
      return 0;
    }
    try {
      return await this.redis.decrby(key, by);
    } catch (error) {
      console.error(`[Cache] Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const result = await this.redis.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error setting expiration for ${key}:`, error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    if (!this.redis) return keys.map(() => null);
    try {
      const values = await this.redis.mget(...keys);
      return values.map((v) => (v ? (JSON.parse(v) as T) : null));
    } catch (error) {
      console.error('[Cache] Error in mget:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    if (entries.length === 0) return true;
    if (!this.redis) return false;
    try {
      const pipeline = this.redis.pipeline();
      for (const { key, value, ttl } of entries) {
        const serialized = JSON.stringify(value);
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('[Cache] Error in mset:', error);
      return false;
    }
  }

  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    if (!this.redis) {
      return { allowed: true, remaining: maxRequests, resetIn: windowSeconds };
    }

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}`);
      pipeline.zcard(key);
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      if (!results) {
        return { allowed: true, remaining: maxRequests - 1, resetIn: windowSeconds };
      }

      const count = results[2]?.[1] as number;
      const allowed = count <= maxRequests;
      const remaining = Math.max(0, maxRequests - count);

      return { allowed, remaining, resetIn: windowSeconds };
    } catch (error) {
      console.error(`[Cache] Rate limit error for ${key}:`, error);
      return { allowed: true, remaining: maxRequests, resetIn: windowSeconds };
    }
  }
}

let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

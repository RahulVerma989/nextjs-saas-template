import { getRedisClient } from '@/lib/cache/redis-client';
import { CacheKeys } from '@/lib/cache/keys';
import { MCP_RATE_LIMITS, type RateLimitConfig } from '@/config/mcp-tools.config';
import { UsageLog } from '@/lib/db/models/usage-log.model';
import { generateUUID7 } from '@/lib/utils/uuid';
import type { Plan, MCPToolId } from '@/types/db.types';

export interface MCPRateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  currentCount: number;
}

function getTodayWindow(): string {
  return new Date().toISOString().slice(0, 10);
}

function msUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export async function checkMCPRateLimit(
  userId: string,
  plan: Plan
): Promise<MCPRateLimitResult> {
  const config = MCP_RATE_LIMITS[plan];
  const redis = getRedisClient();
  const redisKey = CacheKeys.mcpRateLimit(userId);
  const windowDate = getTodayWindow();

  try {
    let currentCount = await getRedisCount(redis, redisKey);
    if (currentCount === null) {
      currentCount = await recoverFromDB(redis, redisKey, userId, windowDate);
    }

    const resetAt = new Date(Date.now() + msUntilMidnightUTC());

    if (currentCount >= config.perWindow) {
      return { allowed: false, remaining: 0, limit: config.perWindow, resetAt, currentCount };
    }

    const burstAllowed = await checkBurstLimit(redis, userId, config);
    if (!burstAllowed) {
      return {
        allowed: false,
        remaining: config.perWindow - currentCount,
        limit: config.perWindow,
        resetAt: new Date(Date.now() + 60_000),
        currentCount,
      };
    }

    return {
      allowed: true,
      remaining: config.perWindow - currentCount - 1,
      limit: config.perWindow,
      resetAt,
      currentCount,
    };
  } catch (error) {
    console.error('[MCP RateLimiter] Check failed, failing open:', error);
    return {
      allowed: true,
      remaining: config.perWindow,
      limit: config.perWindow,
      resetAt: new Date(Date.now() + msUntilMidnightUTC()),
      currentCount: 0,
    };
  }
}

export async function recordMCPSuccess(
  userId: string,
  apiKeyId: string,
  toolId: MCPToolId
): Promise<void> {
  const redis = getRedisClient();
  const redisKey = CacheKeys.mcpRateLimit(userId);
  const windowDate = getTodayWindow();

  try {
    const newCount = await redis.incr(redisKey);
    if (newCount === 1) {
      await redis.pexpire(redisKey, msUntilMidnightUTC());
    }

    const burstKey = `${redisKey}:burst`;
    const now = Date.now();
    await redis
      .pipeline()
      .zadd(burstKey, now, `${now}-${Math.random().toString(36).slice(2)}`)
      .zremrangebyscore(burstKey, 0, now - 60_000)
      .expire(burstKey, 60)
      .exec();

    persistToDB(userId, apiKeyId, toolId, windowDate).catch((err) =>
      console.error('[MCP RateLimiter] DB persist failed:', err)
    );
  } catch (error) {
    console.error('[MCP RateLimiter] Record failed:', error);
    persistToDB(userId, apiKeyId, toolId, windowDate).catch(() => {});
  }
}

export async function getMCPUsage(
  userId: string,
  plan: Plan
): Promise<{ used: number; limit: number; resetAt: Date }> {
  const config = MCP_RATE_LIMITS[plan];
  const redis = getRedisClient();
  const redisKey = CacheKeys.mcpRateLimit(userId);
  const windowDate = getTodayWindow();

  let count = await getRedisCount(redis, redisKey);
  if (count === null) {
    count = await recoverFromDB(redis, redisKey, userId, windowDate);
  }

  return { used: count, limit: config.perWindow, resetAt: new Date(Date.now() + msUntilMidnightUTC()) };
}

async function getRedisCount(
  redis: ReturnType<typeof getRedisClient>,
  key: string
): Promise<number | null> {
  const val = await redis.get(key);
  if (val === null) return null;
  return parseInt(val, 10) || 0;
}

async function recoverFromDB(
  redis: ReturnType<typeof getRedisClient>,
  redisKey: string,
  userId: string,
  windowDate: string
): Promise<number> {
  try {
    const result = await UsageLog.aggregate([
      { $match: { userId, windowDate } },
      { $group: { _id: null, total: { $sum: '$requestCount' } } },
    ]);
    const count = result[0]?.total ?? 0;

    if (count > 0) {
      await redis.set(redisKey, count.toString());
      await redis.pexpire(redisKey, msUntilMidnightUTC());
    }
    return count;
  } catch (error) {
    console.error('[MCP RateLimiter] DB recovery failed:', error);
    return 0;
  }
}

async function checkBurstLimit(
  redis: ReturnType<typeof getRedisClient>,
  userId: string,
  config: RateLimitConfig
): Promise<boolean> {
  const burstKey = `${CacheKeys.mcpRateLimit(userId)}:burst`;
  const now = Date.now();
  try {
    await redis.zremrangebyscore(burstKey, 0, now - 60_000);
    const burstCount = await redis.zcard(burstKey);
    return burstCount < config.perMinute;
  } catch {
    return true;
  }
}

async function persistToDB(
  userId: string,
  apiKeyId: string,
  toolId: MCPToolId,
  windowDate: string
): Promise<void> {
  await UsageLog.findOneAndUpdate(
    { userId, windowDate, toolId },
    {
      $inc: { requestCount: 1 },
      $set: { lastRequestAt: new Date(), apiKeyId },
      $setOnInsert: { _id: generateUUID7() },
    },
    { upsert: true }
  );
}

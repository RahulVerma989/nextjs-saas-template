import { siteConfig } from '@/config/site.config';

const PRODUCT = siteConfig.name.toLowerCase().replace(/\s+/g, '-');
const ENV = process.env.NODE_ENV || 'development';

export function buildCacheKey(...parts: string[]): string {
  return `${PRODUCT}:${ENV}:${parts.join(':')}`;
}

export const CacheKeys = {
  // User keys
  user: (userId: string) => buildCacheKey('user', userId),
  userCredits: (userId: string) => buildCacheKey('user', userId, 'credits'),

  // Session keys
  session: (sessionId: string) => buildCacheKey('session', sessionId),

  // Subscription keys
  subscription: (userId: string) => buildCacheKey('user', userId, 'subscription'),

  // API key keys
  apiKey: (keyId: string) => buildCacheKey('apikey', keyId),
  apiKeyByHash: (hash: string) => buildCacheKey('apikey', 'hash', hash),
  apiKeysByUser: (userId: string) => buildCacheKey('user', userId, 'apikeys'),

  // OAuth token keys
  oauthTokenByHash: (hash: string) => buildCacheKey('oauth', 'token', hash),

  // Rate limiting keys
  rateLimit: (identifier: string, action: string) => buildCacheKey('ratelimit', action, identifier),
  mcpRateLimit: (keyId: string) => buildCacheKey('ratelimit', 'mcp', keyId),

  // Secrets/Config keys
  secrets: (key: string) => buildCacheKey('secrets', key),

  // Service run keys
  serviceRun: (serviceId: string) => buildCacheKey('service', serviceId, 'lastrun'),
  serviceLock: (serviceId: string) => buildCacheKey('service', serviceId, 'lock'),
} as const;

export const CacheTTL = {
  user: 300,
  userCredits: 60,
  session: 86400,
  subscription: 600,
  apiKey: 600,
  apiKeysByUser: 300,
  oauthToken: 300,
  rateLimit: 60,
  secrets: 300,
  serviceRun: 120,
} as const;

export const CachePatterns = {
  userAll: (userId: string) => buildCacheKey('user', userId, '*'),
  rateLimitAll: (identifier: string) => buildCacheKey('ratelimit', '*', identifier),
} as const;

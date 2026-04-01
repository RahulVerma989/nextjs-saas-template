import Redis, { RedisOptions } from 'ioredis';

interface RedisState {
  client: Redis | null;
  isConnecting: boolean;
}

const state: RedisState = {
  client: null,
  isConnecting: false,
};

function buildRedisOptions(): RedisOptions {
  if (process.env.REDIS_URL) {
    const connectionTimeoutMS = parseInt(process.env.REDIS_CONNECTION_TIMEOUT_MS || '5000', 10);
    return {
      maxRetriesPerRequest: 3,
      connectTimeout: connectionTimeoutMS,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('[Redis] Max retries reached, giving up');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((e) => err.message.includes(e));
      },
      enableReadyCheck: true,
      lazyConnect: false,
    };
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const username = process.env.REDIS_USERNAME || undefined;
  const password = process.env.REDIS_PASSWORD || undefined;
  const db = parseInt(process.env.REDIS_DATABASE || '0', 10);
  const connectionTimeoutMS = parseInt(process.env.REDIS_CONNECTION_TIMEOUT_MS || '5000', 10);
  const tlsEnabled = process.env.REDIS_TLS === 'true';

  const options: RedisOptions = {
    host,
    port,
    username: username || undefined,
    password: password || undefined,
    db,
    maxRetriesPerRequest: 3,
    connectTimeout: connectionTimeoutMS,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.error('[Redis] Max retries reached, giving up');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
    enableReadyCheck: true,
    lazyConnect: false,
  };

  if (tlsEnabled) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  console.log(`[Redis] Connecting to ${host}:${port} (TLS: ${tlsEnabled})`);

  return options;
}

export function getRedisClient(): Redis {
  if (state.client) {
    return state.client;
  }

  state.isConnecting = true;

  const hasExplicitHost = process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost';

  if (process.env.REDIS_URL && !hasExplicitHost) {
    state.client = new Redis(process.env.REDIS_URL, buildRedisOptions());
  } else {
    state.client = new Redis(buildRedisOptions());
  }

  state.client.on('connect', () => {
    console.log('[Redis] Connecting...');
  });

  state.client.on('ready', () => {
    console.log('[Redis] Connected and ready');
    state.isConnecting = false;
  });

  state.client.on('error', (error: Error) => {
    console.error('[Redis] Error:', error.message);
  });

  state.client.on('close', () => {
    console.log('[Redis] Connection closed');
  });

  state.client.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
  });

  state.client.on('end', () => {
    console.log('[Redis] Connection ended');
    state.client = null;
  });

  return state.client;
}

export async function closeRedis(): Promise<void> {
  if (!state.client) return;

  try {
    await state.client.quit();
    state.client = null;
    console.log('[Redis] Disconnected gracefully');
  } catch (error) {
    console.error('[Redis] Error during disconnect:', error);
    state.client?.disconnect();
    state.client = null;
  }
}

export function isRedisConnected(): boolean {
  return state.client?.status === 'ready';
}

export async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

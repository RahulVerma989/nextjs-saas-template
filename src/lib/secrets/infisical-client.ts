import { InfisicalSDK } from '@infisical/sdk';

const cache: Map<string, string> = new Map();

let client: InfisicalSDK | null = null;
let isInitialized = false;

export async function initInfisical(): Promise<void> {
  if (isInitialized && client) return;

  const clientId = process.env.INFISICAL_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
  const siteUrl = process.env.INFISICAL_SITE_URL || 'https://app.infisical.com';

  if (!clientId || !clientSecret) {
    console.warn('[Infisical] Client credentials not set, falling back to environment variables');
    return;
  }

  try {
    client = new InfisicalSDK({ siteUrl });
    await client.auth().universalAuth.login({ clientId, clientSecret });
    isInitialized = true;
    console.log('[Infisical] Client initialized successfully');
    await refreshSecrets();
  } catch (error) {
    console.error('[Infisical] Failed to initialize:', error);
  }
}

export async function refreshSecrets(): Promise<void> {
  if (!client || !isInitialized) return;

  const projectId = process.env.INFISICAL_PROJECT_ID;
  const environment = process.env.INFISICAL_ENVIRONMENT || 'dev';

  if (!projectId) {
    console.warn('[Infisical] Project ID not set');
    return;
  }

  try {
    const secrets = await client.secrets().listSecrets({
      projectId,
      environment,
      secretPath: '/',
    });

    cache.clear();
    for (const secret of secrets.secrets) {
      cache.set(secret.secretKey, secret.secretValue);
      process.env[secret.secretKey] = secret.secretValue;
    }

    if (cache.has('NEXTAUTH_SECRET') && !cache.has('AUTH_SECRET')) {
      process.env.AUTH_SECRET = cache.get('NEXTAUTH_SECRET')!;
    }

    if (cache.has('NEXTAUTH_URL') && !cache.has('AUTH_URL')) {
      process.env.AUTH_URL = cache.get('NEXTAUTH_URL')!;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (!process.env.AUTH_URL) process.env.AUTH_URL = appUrl;
    if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = appUrl;

    console.log(`[Infisical] Refreshed ${secrets.secrets.length} secrets`);
    notifyRefreshListeners();
  } catch (error) {
    console.error('[Infisical] Failed to refresh secrets:', error);
  }
}

export function getSecret(key: string): string | undefined {
  if (cache.has(key)) return cache.get(key);
  return process.env[key];
}

type RefreshListener = () => void;
const refreshListeners: Set<RefreshListener> = new Set();

export function onSecretsRefresh(listener: RefreshListener): () => void {
  refreshListeners.add(listener);
  return () => refreshListeners.delete(listener);
}

function notifyRefreshListeners(): void {
  for (const listener of refreshListeners) {
    try {
      listener();
    } catch (error) {
      console.error('[Infisical] Error in refresh listener:', error);
    }
  }
}

export function getCachedSecretKeys(): string[] {
  return Array.from(cache.keys());
}

export function isInfisicalInitialized(): boolean {
  return isInitialized;
}

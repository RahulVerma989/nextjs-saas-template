import crypto from 'crypto';
import {
  initInfisical,
  getSecret as getInfisicalSecret,
  refreshSecrets,
  onSecretsRefresh,
  isInfisicalInitialized,
} from './infisical-client';

export type SecretKey =
  | 'MONGODB_URI'
  | 'REDIS_URL'
  | 'GOOGLE_CLIENT_ID'
  | 'GOOGLE_CLIENT_SECRET'
  | 'DODO_API_KEY'
  | 'DODO_ENVIRONMENT'
  | 'DODO_WEBHOOK_SECRET'
  | 'NEXTAUTH_SECRET'
  | 'NEXTAUTH_URL'
  | 'RESEND_API_KEY'
  | 'R2_ACCESS_KEY_ID'
  | 'R2_SECRET_ACCESS_KEY';

export async function initSecrets(): Promise<void> {
  await initInfisical();
}

export function getSecret(key: SecretKey): string {
  const value = getInfisicalSecret(key);
  if (!value) {
    throw new Error(`Missing required secret: ${key}`);
  }
  return value;
}

export function getSecretOptional(key: SecretKey): string | undefined {
  return getInfisicalSecret(key);
}

export { refreshSecrets };
export { onSecretsRefresh };
export { isInfisicalInitialized as isSecretsInitialized };

export async function handleSecretWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const webhookSecret = process.env.INFISICAL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Secrets] Webhook secret not configured');
    return false;
  }

  if (!signatureHeader) {
    console.warn('[Secrets] Missing webhook signature header');
    return false;
  }

  let sigValue = signatureHeader;
  if (signatureHeader.includes(';')) {
    const parts = signatureHeader.split(';');
    sigValue = parts[parts.length - 1];
  } else if (signatureHeader.startsWith('sha256=')) {
    sigValue = signatureHeader.slice(7);
  }

  sigValue = sigValue.trim();

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expected.length !== sigValue.length) {
    console.warn('[Secrets] Webhook signature length mismatch');
    return false;
  }

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigValue))) {
    console.warn('[Secrets] Webhook signature mismatch');
    return false;
  }

  console.log('[Secrets] Webhook verified, refreshing secrets...');
  await refreshSecrets();
  return true;
}

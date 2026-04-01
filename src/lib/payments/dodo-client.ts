import DodoPayments from 'dodopayments';
import { getSecret, getSecretOptional, onSecretsRefresh } from '@/lib/secrets/secrets-manager';
import { PLANS } from '@/config/plans.config';
import type { Plan } from '@/types/db.types';

let client: DodoPayments | null = null;

onSecretsRefresh(() => {
  client = null;
  console.log('[Dodo] Resetting client due to secret refresh');
});

function getClient(): DodoPayments {
  if (client) return client;

  const apiKey = getSecret('DODO_API_KEY');
  const dodoEnv = getSecretOptional('DODO_ENVIRONMENT') ?? process.env.DODO_ENVIRONMENT;
  const env = dodoEnv === 'live_mode' ? 'live_mode' : 'test_mode';

  client = new DodoPayments({
    bearerToken: apiKey,
    environment: env as 'live_mode' | 'test_mode',
  });

  console.log(`[Dodo] Client initialized (${env})`);
  return client;
}

export function getWebhookSecret(): string {
  return getSecret('DODO_WEBHOOK_SECRET');
}

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  plan: Exclude<Plan, 'free'>;
  returnUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const planKey = params.plan === 'early_adopter' ? 'starter' : params.plan;
  const planConfig = PLANS[planKey as keyof typeof PLANS];

  if (!planConfig?.productId) {
    throw new Error(`No Dodo product ID configured for plan: ${params.plan}`);
  }

  const session = await getClient().checkoutSessions.create({
    product_cart: [{ product_id: planConfig.productId, quantity: 1 }],
    customer: { email: params.email },
    metadata: { userId: params.userId, plan: params.plan },
    return_url: params.returnUrl,
  });

  if (!session.checkout_url) {
    throw new Error('Payment gateway returned no checkout URL');
  }

  return { checkoutUrl: session.checkout_url, sessionId: session.session_id };
}

export async function createTopUpCheckoutSession(params: {
  userId: string;
  email: string;
  productId: string;
  packName: string;
  credits: number;
  returnUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const session = await getClient().checkoutSessions.create({
    product_cart: [{ product_id: params.productId, quantity: 1 }],
    customer: { email: params.email },
    metadata: {
      userId: params.userId,
      type: 'credit_topup',
      packName: params.packName,
      credits: params.credits.toString(),
    },
    return_url: params.returnUrl,
  });

  if (!session.checkout_url) {
    throw new Error('Payment gateway returned no checkout URL');
  }

  return { checkoutUrl: session.checkout_url, sessionId: session.session_id };
}

export async function getSubscription(subscriptionId: string) {
  const sub = await getClient().subscriptions.retrieve(subscriptionId);
  return {
    id: sub.subscription_id,
    status: sub.status,
    nextBillingDate: new Date(sub.next_billing_date),
    previousBillingDate: new Date(sub.previous_billing_date),
    cancelAtNextBillingDate: sub.cancel_at_next_billing_date,
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await getClient().subscriptions.update(subscriptionId, { cancel_at_next_billing_date: true });
}

export async function reactivateSubscription(subscriptionId: string): Promise<void> {
  await getClient().subscriptions.update(subscriptionId, { cancel_at_next_billing_date: false });
}

export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  const portal = await getClient().customers.customerPortal.create(customerId, { send_email: false });
  return portal.link;
}

export function verifyAndParseWebhook(body: string, headers: Record<string, string>) {
  const webhookKey = getWebhookSecret();
  return getClient().webhooks.unwrap(body, { headers, key: webhookKey });
}

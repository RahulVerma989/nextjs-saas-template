import { verifyAndParseWebhook } from './dodo-client';
import { getUserCrud } from '@/lib/db/crud/user.crud';
import { getCreditCrud } from '@/lib/db/crud/credit.crud';
import { PlanLimits } from '@/config/features.config';
import { generateUUID7 } from '@/lib/utils/uuid';
import { Subscription } from '@/lib/db/models/subscription.model';
import type { Plan } from '@/types/db.types';

export async function handleDodoWebhook(
  payload: string,
  headers: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  let event: { type: string; data: Record<string, unknown> };
  try {
    event = verifyAndParseWebhook(payload, headers) as typeof event;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('[Webhook] Verification failed:', msg);
    return { success: false, message: msg };
  }

  console.log(`[Webhook] Processing ${event.type}`);

  try {
    switch (event.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data);
        break;
      case 'payment.failed':
        console.warn(`[Webhook] Payment failed: ${event.data.payment_id}`);
        break;
      case 'subscription.active':
        await handleSubscriptionActive(event.data);
        break;
      case 'subscription.renewed':
        await handleSubscriptionRenewed(event.data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;
      case 'subscription.failed':
      case 'subscription.on_hold':
        await handleSubscriptionPastDue(event.data);
        break;
      case 'subscription.plan_changed':
        await handleSubscriptionPlanChanged(event.data);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
    return { success: true, message: 'Webhook processed' };
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Webhook processing failed',
    };
  }
}

function getMeta(data: Record<string, unknown>): Record<string, string> {
  return (data.metadata as Record<string, string>) ?? {};
}

async function handlePaymentSucceeded(data: Record<string, unknown>) {
  const meta = getMeta(data);
  if (!meta.userId || meta.type !== 'credit_topup') return;

  const credits = parseInt(meta.credits ?? '0', 10);
  if (!credits || credits <= 0) return;

  const creditCrud = getCreditCrud();
  await creditCrud.addCredits(meta.userId, credits, 'wallet_topup', {
    referenceType: 'purchase',
    description: `Credit top-up: ${credits} credits (${meta.packName || 'custom'})`,
  });

  console.log(`[Webhook] Top-up: ${credits} credits for user ${meta.userId}`);
}

async function handleSubscriptionActive(data: Record<string, unknown>) {
  const meta = getMeta(data);
  const userId = meta.userId;
  const plan = meta.plan as Plan | undefined;

  if (!userId || !plan) throw new Error('Missing userId or plan in webhook metadata');

  const customer = data.customer as { customer_id: string } | undefined;
  const planLimits = PlanLimits[plan];
  const userCrud = getUserCrud();
  const creditCrud = getCreditCrud();

  const subscription = await Subscription.findOneAndUpdate(
    { userId },
    {
      $set: {
        dodoSubscriptionId: data.subscription_id as string,
        dodoCustomerId: customer?.customer_id ?? '',
        plan,
        status: 'active',
        currentPeriodStart: new Date(data.previous_billing_date as string),
        currentPeriodEnd: new Date(data.next_billing_date as string),
        cancelAtPeriodEnd: false,
        monthlyCredits: planLimits.monthlyCredits,
        creditsAllocatedAt: new Date(),
      },
      $push: { planHistory: { plan, startDate: new Date() } },
      $setOnInsert: { _id: generateUUID7() },
    },
    { upsert: true, new: true }
  );

  await userCrud.updatePlan(userId, plan);

  if (planLimits.monthlyCredits > 0) {
    await creditCrud.addCredits(userId, planLimits.monthlyCredits, 'subscription', {
      referenceType: 'subscription',
      referenceId: subscription._id as string,
      description: `Initial ${plan} plan credits`,
    });
  }

  console.log(`[Webhook] Subscription active for user ${userId}, plan: ${plan}`);
}

async function handleSubscriptionRenewed(data: Record<string, unknown>) {
  const subscription = await Subscription.findOne({
    dodoSubscriptionId: data.subscription_id as string,
  });
  if (!subscription) return;

  const creditCrud = getCreditCrud();
  const planLimits = PlanLimits[subscription.plan];

  const periodStart = new Date(data.previous_billing_date as string);
  const lastAllocation = subscription.creditsAllocatedAt;

  if (!lastAllocation || periodStart > lastAllocation) {
    if (planLimits.monthlyCredits > 0) {
      const { User } = await import('@/lib/db/models/user.model');
      await User.findByIdAndUpdate(subscription.userId, {
        $set: { creditBalance: planLimits.monthlyCredits },
      });

      await creditCrud.addCredits(subscription.userId, planLimits.monthlyCredits, 'monthly_refresh', {
        referenceType: 'subscription',
        referenceId: subscription._id,
        description: `Monthly ${subscription.plan} plan credits reset`,
      });

      subscription.creditsAllocatedAt = new Date();
    }
  }

  subscription.currentPeriodStart = new Date(data.previous_billing_date as string);
  subscription.currentPeriodEnd = new Date(data.next_billing_date as string);
  subscription.status = 'active';
  await subscription.save();
}

async function handleSubscriptionCancelled(data: Record<string, unknown>) {
  const subscription = await Subscription.findOne({
    dodoSubscriptionId: data.subscription_id as string,
  });
  if (!subscription) return;

  subscription.status = 'canceled';
  await subscription.save();
  await getUserCrud().updatePlan(subscription.userId, 'free');

  console.log(`[Webhook] Subscription cancelled, user downgraded`);
}

async function handleSubscriptionPastDue(data: Record<string, unknown>) {
  const subscription = await Subscription.findOne({
    dodoSubscriptionId: data.subscription_id as string,
  });
  if (!subscription) return;

  subscription.status = 'past_due';
  await subscription.save();
}

async function handleSubscriptionPlanChanged(data: Record<string, unknown>) {
  const meta = getMeta(data);
  const newPlan = meta.plan as Exclude<Plan, 'free'> | undefined;

  const subscription = await Subscription.findOne({
    dodoSubscriptionId: data.subscription_id as string,
  });
  if (!subscription || !newPlan || newPlan === subscription.plan) return;

  const planLimits = PlanLimits[newPlan];
  subscription.plan = newPlan;
  subscription.monthlyCredits = planLimits.monthlyCredits;
  await subscription.save();
  await getUserCrud().updatePlan(subscription.userId, newPlan);
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  const subscription = await Subscription.findOne({
    dodoSubscriptionId: data.subscription_id as string,
  });
  if (!subscription) return;

  if (data.previous_billing_date) {
    subscription.currentPeriodStart = new Date(data.previous_billing_date as string);
  }
  if (data.next_billing_date) {
    subscription.currentPeriodEnd = new Date(data.next_billing_date as string);
  }
  if (typeof data.cancel_at_next_billing_date === 'boolean') {
    subscription.cancelAtPeriodEnd = data.cancel_at_next_billing_date;
  }
  await subscription.save();
}

/**
 * Pricing plans configuration.
 *
 * Update these to match your Dodo Payments product IDs and pricing.
 * The billing page and checkout flow read from here.
 */

import type { Plan } from '@/types/db.types';

export interface PlanConfig {
  name: string;
  description: string;
  /** Monthly price in USD (0 for free) */
  price: number;
  /** Dodo Payments product ID — set in .env or here */
  productId: string;
  /** Monthly credit allocation */
  monthlyCredits: number;
  /** Features shown on the pricing page */
  features: string[];
  /** Whether this plan is highlighted as "popular" */
  popular?: boolean;
}

export const PLANS: Record<Exclude<Plan, 'early_adopter'>, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'Get started with the basics',
    price: 0,
    productId: '',
    monthlyCredits: 500,
    features: [
      '500 credits/month',
      '2 API keys',
      'Community support',
      'Basic features',
    ],
  },
  starter: {
    name: 'Starter',
    description: 'For growing projects',
    price: 19,
    productId: process.env.DODO_STARTER_PRODUCT_ID || '',
    monthlyCredits: 5000,
    features: [
      '5,000 credits/month',
      '5 API keys',
      'Email support',
      'All features',
      '300 MCP requests/day',
    ],
    popular: true,
  },
  pro: {
    name: 'Pro',
    description: 'For professional teams',
    price: 49,
    productId: process.env.DODO_PRO_PRODUCT_ID || '',
    monthlyCredits: 25000,
    features: [
      '25,000 credits/month',
      '15 API keys',
      'Priority support',
      'Custom branding',
      '1,500 MCP requests/day',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large-scale operations',
    price: 149,
    productId: process.env.DODO_ENTERPRISE_PRODUCT_ID || '',
    monthlyCredits: 100000,
    features: [
      '100,000 credits/month',
      '25 API keys',
      'Dedicated support',
      'Custom branding',
      '5,000 MCP requests/day',
      'Admin panel access',
    ],
  },
};

/**
 * Get plan config by plan ID.
 */
export function getPlanConfig(plan: Plan): PlanConfig {
  if (plan === 'early_adopter') return PLANS.starter;
  return PLANS[plan] || PLANS.free;
}

/**
 * Credit system configuration.
 *
 * Define how credits are consumed for different operations.
 * If you don't use credits, set `siteConfig.features.credits = false`.
 */

export interface CreditCost {
  /** Human-readable label */
  label: string;
  /** Number of credits consumed per operation */
  cost: number;
}

/**
 * Define credit costs for your SaaS operations.
 * These are examples — customize for your use case.
 */
export const CREDIT_COSTS: Record<string, CreditCost> = {
  api_call: {
    label: 'API Call',
    cost: 1,
  },
  file_upload: {
    label: 'File Upload',
    cost: 5,
  },
  export: {
    label: 'Data Export',
    cost: 10,
  },
};

/**
 * Credit top-up packs available for purchase.
 */
export const CREDIT_PACKS = [
  { credits: 1000, price: 5, label: '1,000 credits' },
  { credits: 5000, price: 20, label: '5,000 credits' },
  { credits: 15000, price: 50, label: '15,000 credits' },
  { credits: 50000, price: 150, label: '50,000 credits' },
];

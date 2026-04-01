/**
 * Feature matrix — defines what each plan can access.
 *
 * Add your own feature keys and toggle them per plan.
 * The feature gate (`src/lib/feature-gate/gate.ts`) reads this config
 * at runtime to enforce limits.
 */

import type { Plan } from '@/types/db.types';

export interface PlanLimits {
  /** Max number of API keys the user can create */
  maxApiKeys: number;
  /** Max file upload size in MB */
  maxUploadSizeMB: number;
  /** Whether the user can access the admin panel (requires admin role too) */
  adminAccess: boolean;
  /** MCP daily request quota */
  mcpDailyRequests: number;
  /** Custom branding (remove "Powered by" badge) */
  customBranding: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxApiKeys: 2,
    maxUploadSizeMB: 5,
    adminAccess: false,
    mcpDailyRequests: 25,
    customBranding: false,
  },
  early_adopter: {
    maxApiKeys: 5,
    maxUploadSizeMB: 25,
    adminAccess: false,
    mcpDailyRequests: 500,
    customBranding: false,
  },
  starter: {
    maxApiKeys: 5,
    maxUploadSizeMB: 25,
    adminAccess: false,
    mcpDailyRequests: 300,
    customBranding: false,
  },
  pro: {
    maxApiKeys: 15,
    maxUploadSizeMB: 100,
    adminAccess: false,
    mcpDailyRequests: 1500,
    customBranding: true,
  },
  enterprise: {
    maxApiKeys: 25,
    maxUploadSizeMB: 500,
    adminAccess: true,
    mcpDailyRequests: 5000,
    customBranding: true,
  },
};

/**
 * Check if a plan has access to a specific feature limit.
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

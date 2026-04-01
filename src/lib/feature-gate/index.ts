import { PLAN_LIMITS, type PlanLimits } from '@/config/features.config';
import type { Plan } from '@/types/db.types';

export class FeatureGate {
  private plan: Plan;
  private limits: PlanLimits;

  constructor(plan: Plan) {
    this.plan = plan;
    this.limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  }

  get maxApiKeys(): number {
    return this.limits.maxApiKeys;
  }

  get maxUploadSizeMB(): number {
    return this.limits.maxUploadSizeMB;
  }

  get mcpDailyRequests(): number {
    return this.limits.mcpDailyRequests;
  }

  get customBranding(): boolean {
    return this.limits.customBranding;
  }

  get adminAccess(): boolean {
    return this.limits.adminAccess;
  }

  canCreateApiKey(currentCount: number): boolean {
    return currentCount < this.limits.maxApiKeys;
  }

  canUploadFile(fileSizeMB: number): boolean {
    return fileSizeMB <= this.limits.maxUploadSizeMB;
  }

  canMakeMCPRequest(currentDailyCount: number): boolean {
    return currentDailyCount < this.limits.mcpDailyRequests;
  }

  getLimits(): PlanLimits {
    return { ...this.limits };
  }

  getPlan(): Plan {
    return this.plan;
  }
}

export function createFeatureGate(plan: Plan): FeatureGate {
  return new FeatureGate(plan);
}

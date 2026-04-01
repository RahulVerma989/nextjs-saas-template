import { getMCPUsage } from '../../rate-limiter';
import { getUserCrud } from '@/lib/db/crud/user.crud';
import { getCreditCrud } from '@/lib/db/crud/credit.crud';
import type { Plan } from '@/types/db.types';
import type { ToolHandler } from '../index';

export const handleGetUsageStats: ToolHandler = async (_args, userId) => {
  const userCrud = getUserCrud();
  const user = await userCrud.findById(userId);

  if (!user) throw new Error('User not found');

  const mcpUsage = await getMCPUsage(userId, user.plan as Plan);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const creditCrud = getCreditCrud();
  const creditsSpent = await creditCrud.getTotalSpent(userId, startOfMonth, now);

  return {
    plan: user.plan,
    credits: {
      balance: user.creditBalance,
      spentThisMonth: creditsSpent,
    },
    mcp: {
      usedToday: mcpUsage.used,
      dailyLimit: mcpUsage.limit,
      remaining: mcpUsage.limit - mcpUsage.used,
      resetsAt: mcpUsage.resetAt.toISOString(),
    },
  };
};

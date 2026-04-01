import { getUserCrud } from '@/lib/db/crud/user.crud';
import type { ToolHandler } from '../index';

export const handleGetUserProfile: ToolHandler = async (_args, userId) => {
  const userCrud = getUserCrud();
  const user = await userCrud.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    creditBalance: user.creditBalance,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
};

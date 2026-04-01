import type { Plan, UserRole, AccountStatus } from './db.types';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: Plan;
  roles: UserRole[];
  accountStatus: AccountStatus;
  creditBalance: number;
  walletBalance: number;
  preferences: {
    emailNotifications: boolean;
    timezone: string;
  };
  createdAt: string;
}

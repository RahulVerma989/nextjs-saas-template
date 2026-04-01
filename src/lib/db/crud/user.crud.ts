import { Model } from 'mongoose';
import { User } from '../models/user.model';
import { BaseCrud, PaginationOptions, PaginatedResult } from './base.crud';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import { generateUUID7 } from '@/lib/utils/uuid';
import { siteConfig } from '@/config/site.config';
import type { IUser, Plan } from '@/types/db.types';

export class UserCrud extends BaseCrud<IUser> {
  protected model: Model<IUser> = User;

  protected getCacheKey(id: string): string {
    return CacheKeys.user(id);
  }

  protected getCacheTTL(): number {
    return CacheTTL.user;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    await this.ensureConnection();
    return this.model.findOne({ email: email.toLowerCase() }).lean() as Promise<IUser | null>;
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    await this.ensureConnection();
    return this.model.findOne({ googleId }).lean() as Promise<IUser | null>;
  }

  async createUser(data: {
    email: string;
    name: string;
    googleId: string;
    avatarUrl?: string;
  }): Promise<IUser> {
    return this.create({
      _id: generateUUID7(),
      ...data,
      plan: 'free',
      creditBalance: 0,
      accountStatus: siteConfig.features.waitlistMode ? 'pending' : 'approved',
      preferences: {
        emailNotifications: true,
        timezone: 'UTC',
      },
    } as Partial<IUser>);
  }

  async findOrCreateByGoogle(data: {
    email: string;
    name: string;
    googleId: string;
    avatarUrl?: string;
  }): Promise<{ user: IUser; isNew: boolean }> {
    let user = await this.findByGoogleId(data.googleId);

    if (user) {
      await this.update(user._id, {
        lastLoginAt: new Date(),
        name: data.name,
        avatarUrl: data.avatarUrl,
      } as Partial<IUser>);

      user = (await this.findById(user._id))!;
      return { user, isNew: false };
    }

    const existingByEmail = await this.findByEmail(data.email);
    if (existingByEmail) {
      throw new Error('Email already registered with a different account');
    }

    user = await this.createUser(data);
    return { user, isNew: true };
  }

  async updatePlan(userId: string, plan: Plan): Promise<IUser | null> {
    const user = await this.update(userId, { plan } as Partial<IUser>);
    if (user) {
      await this.cache.delete(CacheKeys.userCredits(userId));
    }
    return user;
  }

  async getCreditBalance(userId: string): Promise<number> {
    const cacheKey = CacheKeys.userCredits(userId);
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const user = await this.model.findById(userId).select('creditBalance').lean();
        return user?.creditBalance ?? 0;
      },
      CacheTTL.userCredits
    );
  }

  async updateCreditBalance(
    userId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<number> {
    await this.ensureConnection();

    const update =
      operation === 'add'
        ? { $inc: { creditBalance: amount } }
        : { $inc: { creditBalance: -amount } };

    const user = await this.model
      .findByIdAndUpdate(userId, update, { new: true })
      .select('creditBalance')
      .lean();

    if (!user) {
      throw new Error('User not found');
    }

    await this.cache.delete(CacheKeys.user(userId));
    await this.cache.set(CacheKeys.userCredits(userId), user.creditBalance, CacheTTL.userCredits);

    return user.creditBalance;
  }

  async setCreditBalance(userId: string, balance: number): Promise<IUser | null> {
    const user = await this.update(userId, { creditBalance: balance } as Partial<IUser>);
    if (user) {
      await this.cache.set(CacheKeys.userCredits(userId), balance, CacheTTL.userCredits);
    }
    return user;
  }

  async listUsers(
    options: PaginationOptions & { search?: string }
  ): Promise<PaginatedResult<IUser>> {
    const query: Record<string, unknown> = {};

    if (options.search) {
      query.$or = [
        { email: { $regex: options.search, $options: 'i' } },
        { name: { $regex: options.search, $options: 'i' } },
      ];
    }

    return this.findMany(query, {
      page: options.page,
      limit: options.limit,
      sort: { createdAt: -1 },
    });
  }
}

let userCrudInstance: UserCrud | null = null;

export function getUserCrud(): UserCrud {
  if (!userCrudInstance) {
    userCrudInstance = new UserCrud();
  }
  return userCrudInstance;
}

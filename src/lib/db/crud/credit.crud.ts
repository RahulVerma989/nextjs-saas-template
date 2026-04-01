import { Model } from 'mongoose';
import { CreditTransaction } from '../models/credit-transaction.model';
import { User } from '../models/user.model';
import { BaseCrud, PaginatedResult, PaginationOptions } from './base.crud';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import { generateUUID7 } from '@/lib/utils/uuid';
import type {
  ICreditTransaction,
  CreditSource,
  CreditTransactionType,
} from '@/types/db.types';

export interface CreateTransactionData {
  userId: string;
  type: CreditTransactionType;
  amount: number;
  source: CreditSource;
  referenceType?: string;
  referenceId?: string;
  metadata?: {
    description?: string;
    [key: string]: unknown;
  };
}

export class CreditCrud extends BaseCrud<ICreditTransaction> {
  protected model: Model<ICreditTransaction> = CreditTransaction;

  protected getCacheKey(id: string): string {
    return `transaction:${id}`;
  }

  protected getCacheTTL(): number {
    return 0;
  }

  async createTransaction(data: CreateTransactionData): Promise<ICreditTransaction> {
    await this.ensureConnection();

    const user = await User.findById(data.userId).select('creditBalance walletBalance').lean();
    if (!user) {
      throw new Error('User not found');
    }

    let newCreditBalance = user.creditBalance;
    let newWalletBalance = (user as Record<string, unknown>).walletBalance as number ?? 0;

    if (data.type === 'credit') {
      if (data.source === 'wallet_topup') {
        newWalletBalance += data.amount;
      } else {
        newCreditBalance += data.amount;
      }
    } else {
      const totalAvailable = newCreditBalance + newWalletBalance;
      if (totalAvailable < data.amount) {
        throw new Error('Insufficient credits');
      }

      const fromPlan = Math.min(newCreditBalance, data.amount);
      const fromWallet = data.amount - fromPlan;

      newCreditBalance -= fromPlan;
      newWalletBalance -= fromWallet;
    }

    const combinedBalance = newCreditBalance + newWalletBalance;

    const transaction = new this.model({
      _id: generateUUID7(),
      ...data,
      balanceAfter: combinedBalance,
      createdAt: new Date(),
    });

    await transaction.save();

    const updatedUser = await User.findByIdAndUpdate(
      data.userId,
      { $set: { creditBalance: newCreditBalance, walletBalance: newWalletBalance } },
      { new: true }
    ).lean();

    if (updatedUser) {
      await Promise.all([
        this.cache.set(CacheKeys.user(data.userId), updatedUser, CacheTTL.user),
        this.cache.set(CacheKeys.userCredits(data.userId), combinedBalance, CacheTTL.userCredits),
      ]);
    }

    return transaction.toObject() as ICreditTransaction;
  }

  async addCredits(
    userId: string,
    amount: number,
    source: CreditSource,
    options?: {
      referenceType?: string;
      referenceId?: string;
      description?: string;
    }
  ): Promise<ICreditTransaction> {
    return this.createTransaction({
      userId,
      type: 'credit',
      amount,
      source,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      metadata: options?.description ? { description: options.description } : undefined,
    });
  }

  async spendCredits(
    userId: string,
    amount: number,
    source: CreditSource,
    options?: {
      referenceType?: string;
      referenceId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ICreditTransaction> {
    return this.createTransaction({
      userId,
      type: 'debit',
      amount,
      source,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      metadata: options?.metadata,
    });
  }

  async getHistory(
    userId: string,
    options: PaginationOptions & {
      source?: CreditSource;
      type?: CreditTransactionType;
    }
  ): Promise<PaginatedResult<ICreditTransaction>> {
    const query: Record<string, unknown> = { userId };
    if (options.source) query.source = options.source;
    if (options.type) query.type = options.type;

    return this.findMany(query, {
      page: options.page,
      limit: options.limit,
      sort: { createdAt: -1 },
    });
  }

  async getTotalSpent(userId: string, startDate: Date, endDate: Date): Promise<number> {
    await this.ensureConnection();
    const result = await this.model.aggregate([
      {
        $match: {
          userId,
          type: 'debit',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async getUsageBySource(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<CreditSource, number>> {
    await this.ensureConnection();
    const result = await this.model.aggregate([
      {
        $match: {
          userId,
          type: 'debit',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$source', total: { $sum: '$amount' } } },
    ]);

    const breakdown: Partial<Record<CreditSource, number>> = {};
    for (const item of result) {
      breakdown[item._id as CreditSource] = item.total;
    }
    return breakdown as Record<CreditSource, number>;
  }

  async canAfford(userId: string, amount: number): Promise<boolean> {
    const user = await User.findById(userId).select('creditBalance walletBalance').lean();
    const total = (user?.creditBalance ?? 0) + ((user as Record<string, unknown>)?.walletBalance as number ?? 0);
    return total >= amount;
  }

  async getBalance(userId: string): Promise<number> {
    const cacheKey = CacheKeys.userCredits(userId);
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const user = await User.findById(userId).select('creditBalance walletBalance').lean();
        return (user?.creditBalance ?? 0) + ((user as Record<string, unknown>)?.walletBalance as number ?? 0);
      },
      CacheTTL.userCredits
    );
  }

  async update(): Promise<ICreditTransaction | null> {
    throw new Error('Credit transactions are immutable');
  }

  async delete(): Promise<boolean> {
    throw new Error('Credit transactions cannot be deleted');
  }
}

let creditCrudInstance: CreditCrud | null = null;

export function getCreditCrud(): CreditCrud {
  if (!creditCrudInstance) {
    creditCrudInstance = new CreditCrud();
  }
  return creditCrudInstance;
}

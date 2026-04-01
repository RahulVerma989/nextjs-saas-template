import { Model } from 'mongoose';
import { getCacheManager, CacheManager } from '@/lib/cache/cache-manager';
import { connectDB } from '../connection';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseCrud<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract model: Model<any>;
  protected cache: CacheManager;

  constructor() {
    this.cache = getCacheManager();
  }

  protected async ensureConnection(): Promise<void> {
    await connectDB();
  }

  protected abstract getCacheKey(id: string): string;
  protected abstract getCacheTTL(): number;

  async findById(id: string): Promise<T | null> {
    await this.ensureConnection();
    const cacheKey = this.getCacheKey(id);
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const doc = await this.model.findById(id).lean();
        return doc as T | null;
      },
      this.getCacheTTL()
    );
  }

  async findOne(query: Record<string, unknown>): Promise<T | null> {
    await this.ensureConnection();
    const doc = await this.model.findOne(query).lean();
    return doc as T | null;
  }

  async findMany(
    query: Record<string, unknown>,
    options: PaginationOptions & {
      sort?: Record<string, 1 | -1>;
      select?: Record<string, 0 | 1>;
    }
  ): Promise<PaginatedResult<T>> {
    await this.ensureConnection();
    const { page, limit, sort = { createdAt: -1 }, select } = options;
    const skip = (page - 1) * limit;

    let mongoQuery = this.model.find(query).sort(sort).skip(skip).limit(limit);
    if (select) {
      mongoQuery = mongoQuery.select(select);
    }

    const [items, total] = await Promise.all([
      mongoQuery.lean(),
      this.model.countDocuments(query),
    ]);

    return {
      items: items as T[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Partial<T>): Promise<T> {
    await this.ensureConnection();
    const doc = new this.model(data);
    await doc.save();
    await this.onAfterCreate(doc);
    return doc.toObject() as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.ensureConnection();
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();

    if (doc) {
      const cacheKey = this.getCacheKey(id);
      await this.cache.set(cacheKey, doc as T, this.getCacheTTL());
      await this.onAfterUpdate(doc as T);
    }

    return doc as T | null;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();
    const doc = await this.model.findByIdAndDelete(id).lean();
    if (doc) {
      await this.cache.delete(this.getCacheKey(id));
      await this.onAfterDelete(doc as T);
      return true;
    }
    return false;
  }

  async count(query: Record<string, unknown> = {}): Promise<number> {
    await this.ensureConnection();
    return this.model.countDocuments(query);
  }

  async exists(query: Record<string, unknown>): Promise<boolean> {
    await this.ensureConnection();
    const doc = await this.model.exists(query);
    return doc !== null;
  }

  protected async onAfterCreate(_doc: T): Promise<void> {}
  protected async onAfterUpdate(_doc: T): Promise<void> {}
  protected async onAfterDelete(_doc: T): Promise<void> {}
}

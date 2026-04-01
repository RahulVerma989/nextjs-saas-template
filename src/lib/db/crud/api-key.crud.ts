import { Model } from 'mongoose';
import { APIKey } from '../models/api-key.model';
import { BaseCrud } from './base.crud';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import { generateUUID7 } from '@/lib/utils/uuid';
import crypto from 'crypto';
import type { IAPIKey, MCPToolId } from '@/types/db.types';

const API_KEY_PREFIX = 'sk_';

export class APIKeyCrud extends BaseCrud<IAPIKey> {
  protected model: Model<IAPIKey> = APIKey;

  protected getCacheKey(id: string): string {
    return CacheKeys.apiKey(id);
  }

  protected getCacheTTL(): number {
    return CacheTTL.apiKey;
  }

  private generateKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
    const randomPart = crypto.randomBytes(20).toString('hex');
    const rawKey = `${API_KEY_PREFIX}${randomPart}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 10);
    return { rawKey, keyHash, keyPrefix };
  }

  static hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  async createKey(
    userId: string,
    name: string,
    enabledTools: MCPToolId[]
  ): Promise<{ apiKey: IAPIKey; rawKey: string }> {
    const { rawKey, keyHash, keyPrefix } = this.generateKey();

    const apiKey = await this.create({
      _id: generateUUID7(),
      userId,
      name,
      keyHash,
      keyPrefix,
      enabledTools,
    } as Partial<IAPIKey>);

    await this.cache.delete(CacheKeys.apiKeysByUser(userId));

    return { apiKey, rawKey };
  }

  async findByHash(keyHash: string): Promise<IAPIKey | null> {
    const cacheKey = CacheKeys.apiKeyByHash(keyHash);
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        await this.ensureConnection();
        const key = await this.model
          .findOne({
            keyHash,
            revokedAt: null,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          })
          .lean();
        return key as IAPIKey | null;
      },
      CacheTTL.apiKey
    );
  }

  async listByUser(userId: string): Promise<IAPIKey[]> {
    const cacheKey = CacheKeys.apiKeysByUser(userId);
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        await this.ensureConnection();
        const keys = await this.model
          .find({ userId, revokedAt: null })
          .sort({ createdAt: -1 })
          .lean();
        return keys as IAPIKey[];
      },
      CacheTTL.apiKeysByUser
    );
  }

  async revokeKey(keyId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();
    const key = await this.model.findOneAndUpdate(
      { _id: keyId, userId, revokedAt: null },
      { revokedAt: new Date() },
      { new: true }
    ).lean();

    if (key) {
      await Promise.all([
        this.cache.delete(CacheKeys.apiKey(keyId)),
        this.cache.delete(CacheKeys.apiKeyByHash((key as IAPIKey).keyHash)),
        this.cache.delete(CacheKeys.apiKeysByUser(userId)),
      ]);
      return true;
    }
    return false;
  }

  async updateTools(
    keyId: string,
    userId: string,
    enabledTools: MCPToolId[]
  ): Promise<IAPIKey | null> {
    await this.ensureConnection();
    const key = await this.model.findOneAndUpdate(
      { _id: keyId, userId, revokedAt: null },
      { enabledTools },
      { new: true }
    ).lean();

    if (key) {
      const typedKey = key as IAPIKey;
      await Promise.all([
        this.cache.set(CacheKeys.apiKey(keyId), typedKey, CacheTTL.apiKey),
        this.cache.delete(CacheKeys.apiKeyByHash(typedKey.keyHash)),
        this.cache.delete(CacheKeys.apiKeysByUser(userId)),
      ]);
    }
    return key as IAPIKey | null;
  }

  async touchLastUsed(keyId: string): Promise<void> {
    await this.ensureConnection();
    await this.model.updateOne({ _id: keyId }, { lastUsedAt: new Date() });
  }

  async countByUser(userId: string): Promise<number> {
    return this.count({ userId, revokedAt: null });
  }
}

let instance: APIKeyCrud | null = null;

export function getAPIKeyCrud(): APIKeyCrud {
  if (!instance) {
    instance = new APIKeyCrud();
  }
  return instance;
}

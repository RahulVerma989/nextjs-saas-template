import { Model } from 'mongoose';
import { OAuthClient } from '../models/oauth-client.model';
import { OAuthCode } from '../models/oauth-code.model';
import { OAuthToken } from '../models/oauth-token.model';
import { BaseCrud } from './base.crud';
import { getCacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTTL } from '@/lib/cache/keys';
import { generateUUID7 } from '@/lib/utils/uuid';
import crypto from 'crypto';
import type { IOAuthClient, IOAuthCode, IOAuthToken } from '@/types/db.types';

function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateOpaqueToken(prefix: string): string {
  return `${prefix}${crypto.randomBytes(32).toString('hex')}`;
}

// ─── OAuth Client CRUD ────────────────────────────────────────────

export class OAuthClientCrud extends BaseCrud<IOAuthClient> {
  protected model: Model<IOAuthClient> = OAuthClient;

  protected getCacheKey(id: string): string {
    return CacheKeys.oauthTokenByHash(`client:${id}`);
  }

  protected getCacheTTL(): number {
    return CacheTTL.oauthToken;
  }

  async registerClient(data: {
    clientName: string;
    redirectUris: string[];
    grantTypes?: string[];
    responseTypes?: string[];
    tokenEndpointAuthMethod?: string;
  }): Promise<{ client: IOAuthClient; clientSecret?: string }> {
    const clientId = generateUUID7();
    let clientSecret: string | undefined;
    let clientSecretHash: string | undefined;

    if (data.tokenEndpointAuthMethod === 'client_secret_post') {
      clientSecret = generateOpaqueToken('cs_');
      clientSecretHash = hashSHA256(clientSecret);
    }

    const client = await this.create({
      _id: clientId,
      clientName: data.clientName,
      redirectUris: data.redirectUris,
      grantTypes: data.grantTypes || ['authorization_code', 'refresh_token'],
      responseTypes: data.responseTypes || ['code'],
      tokenEndpointAuthMethod: data.tokenEndpointAuthMethod || 'none',
      ...(clientSecretHash ? { clientSecret: clientSecretHash } : {}),
    } as Partial<IOAuthClient>);

    return { client, clientSecret };
  }

  async validateClient(
    clientId: string,
    clientSecret?: string
  ): Promise<IOAuthClient | null> {
    const client = await this.findById(clientId);
    if (!client) return null;

    if (client.tokenEndpointAuthMethod === 'client_secret_post') {
      if (!clientSecret || !client.clientSecret) return null;
      const secretHash = hashSHA256(clientSecret);
      if (secretHash !== client.clientSecret) return null;
    }

    return client;
  }
}

// ─── OAuth Code CRUD ──────────────────────────────────────────────

export class OAuthCodeCrud {
  private async ensureConnection(): Promise<void> {
    const { connectDB } = await import('../connection');
    await connectDB();
  }

  async createCode(data: {
    clientId: string;
    userId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    scope?: string;
  }): Promise<string> {
    await this.ensureConnection();

    const rawCode = generateOpaqueToken('');
    const codeHash = hashSHA256(rawCode);

    await OAuthCode.create({
      _id: generateUUID7(),
      codeHash,
      clientId: data.clientId,
      userId: data.userId,
      redirectUri: data.redirectUri,
      codeChallenge: data.codeChallenge,
      codeChallengeMethod: data.codeChallengeMethod,
      scope: data.scope || 'mcp',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      used: false,
    });

    return rawCode;
  }

  async consumeCode(rawCode: string): Promise<IOAuthCode | null> {
    await this.ensureConnection();

    const codeHash = hashSHA256(rawCode);

    const code = await OAuthCode.findOneAndUpdate(
      {
        codeHash,
        used: false,
        expiresAt: { $gt: new Date() },
      },
      { used: true },
      { new: false }
    ).lean();

    return code as IOAuthCode | null;
  }
}

// ─── OAuth Token CRUD ─────────────────────────────────────────────

export class OAuthTokenCrud {
  private cache = getCacheManager();

  private async ensureConnection(): Promise<void> {
    const { connectDB } = await import('../connection');
    await connectDB();
  }

  async issueTokens(data: {
    clientId: string;
    userId: string;
    scope?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    await this.ensureConnection();

    const accessToken = generateOpaqueToken('at_');
    const refreshToken = generateOpaqueToken('rt_');
    const expiresIn = 3600; // 1 hour

    await OAuthToken.create({
      _id: generateUUID7(),
      tokenHash: hashSHA256(accessToken),
      refreshTokenHash: hashSHA256(refreshToken),
      clientId: data.clientId,
      userId: data.userId,
      scope: data.scope || 'mcp',
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      refreshExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return { accessToken, refreshToken, expiresIn };
  }

  async validateAccessToken(rawToken: string): Promise<IOAuthToken | null> {
    const tokenHash = hashSHA256(rawToken);
    const cacheKey = CacheKeys.oauthTokenByHash(tokenHash);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        await this.ensureConnection();
        const token = await OAuthToken.findOne({
          tokenHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        }).lean();
        return token as IOAuthToken | null;
      },
      CacheTTL.oauthToken
    );
  }

  async refreshTokens(
    rawRefreshToken: string,
    clientId: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } | null> {
    await this.ensureConnection();

    const refreshHash = hashSHA256(rawRefreshToken);

    const oldToken = await OAuthToken.findOneAndUpdate(
      {
        refreshTokenHash: refreshHash,
        clientId,
        revokedAt: null,
        refreshExpiresAt: { $gt: new Date() },
      },
      { revokedAt: new Date() },
      { new: false }
    ).lean() as IOAuthToken | null;

    if (!oldToken) return null;

    await this.cache.delete(CacheKeys.oauthTokenByHash(oldToken.tokenHash));

    return this.issueTokens({
      clientId: oldToken.clientId,
      userId: oldToken.userId,
      scope: oldToken.scope,
    });
  }
}

// ─── Singletons ───────────────────────────────────────────────────

let clientCrud: OAuthClientCrud | null = null;
let codeCrud: OAuthCodeCrud | null = null;
let tokenCrud: OAuthTokenCrud | null = null;

export function getOAuthClientCrud(): OAuthClientCrud {
  if (!clientCrud) clientCrud = new OAuthClientCrud();
  return clientCrud;
}

export function getOAuthCodeCrud(): OAuthCodeCrud {
  if (!codeCrud) codeCrud = new OAuthCodeCrud();
  return codeCrud;
}

export function getOAuthTokenCrud(): OAuthTokenCrud {
  if (!tokenCrud) tokenCrud = new OAuthTokenCrud();
  return tokenCrud;
}

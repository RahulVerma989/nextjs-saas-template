import mongoose, { Schema, Model } from 'mongoose';
import type { IGSCConnection } from '@/types/db.types';

/**
 * Google Search Console connection — singleton per deployment.
 *
 * The whole app shares one GSC property (the site you actually own).
 * We use a fixed _id so there's only ever one row, and any admin can
 * (re-)connect or disconnect it from the SEO settings page.
 */
const GSCConnectionSchema = new Schema<IGSCConnection>(
  {
    _id: { type: String, required: true, default: 'singleton' },
    /** GSC property URL — either a domain property or a URL prefix. */
    siteUrl: { type: String, required: true },
    /** Long-lived refresh token from the OAuth flow. */
    refreshToken: { type: String, required: true },
    /** Cached access token + expiry (refreshed on demand). */
    accessToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true },
    /** Scopes granted on the latest connect — used to detect missing perms. */
    scopes: { type: [String], default: [] },
    /** Audit trail */
    connectedByUserId: { type: String, required: true, ref: 'User' },
    connectedAt: { type: Date, required: true, default: Date.now },
    lastUsedAt: { type: Date },
    lastError: { type: String },
    /** Verification state — refreshed on connect/verify/sync. */
    verified: { type: Boolean, default: false },
    verificationMethod: { type: String, enum: ['META', 'FILE', 'DNS_TXT'] },
    verificationHost: { type: String },
    verificationMetaToken: { type: String },
    verificationFileName: { type: String },
    verificationFileContent: { type: String },
    verificationDnsRecord: { type: String },
  },
  { timestamps: true, collection: 'gsc_connections' },
);

export const GSCConnection: Model<IGSCConnection> =
  (mongoose.models.GSCConnection as Model<IGSCConnection>) ||
  mongoose.model<IGSCConnection>('GSCConnection', GSCConnectionSchema);

export const GSC_CONNECTION_ID = 'singleton';

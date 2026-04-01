import mongoose, { Schema, Model } from 'mongoose';
import type { IOAuthToken } from '@/types/db.types';

const OAuthTokenSchema = new Schema<IOAuthToken>(
  {
    _id: { type: String, required: true },
    tokenHash: { type: String, required: true },
    refreshTokenHash: { type: String },
    clientId: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    scope: { type: String, default: 'mcp' },
    expiresAt: { type: Date, required: true },
    refreshExpiresAt: { type: Date },
    revokedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: false,
  }
);

OAuthTokenSchema.index({ tokenHash: 1 }, { unique: true });
OAuthTokenSchema.index({ refreshTokenHash: 1 }, { unique: true, sparse: true });
OAuthTokenSchema.index({ userId: 1, revokedAt: 1 });
OAuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 });

export const OAuthToken: Model<IOAuthToken> =
  mongoose.models.OAuthToken || mongoose.model<IOAuthToken>('OAuthToken', OAuthTokenSchema);

import mongoose, { Schema, Model } from 'mongoose';
import type { IOAuthCode } from '@/types/db.types';

const OAuthCodeSchema = new Schema<IOAuthCode>(
  {
    _id: { type: String, required: true },
    codeHash: { type: String, required: true },
    clientId: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    redirectUri: { type: String, required: true },
    codeChallenge: { type: String, required: true },
    codeChallengeMethod: { type: String, required: true, default: 'S256' },
    scope: { type: String, default: 'mcp' },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: false,
  }
);

OAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OAuthCodeSchema.index({ codeHash: 1 }, { unique: true });

export const OAuthCode: Model<IOAuthCode> =
  mongoose.models.OAuthCode || mongoose.model<IOAuthCode>('OAuthCode', OAuthCodeSchema);

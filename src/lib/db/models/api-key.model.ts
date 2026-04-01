import mongoose, { Schema, Model } from 'mongoose';
import type { IAPIKey } from '@/types/db.types';

const APIKeySchema = new Schema<IAPIKey>(
  {
    _id: { type: String, required: true },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    keyHash: { type: String, required: true },
    keyPrefix: { type: String, required: true },
    enabledTools: { type: [String], default: [] },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    revokedAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
  }
);

APIKeySchema.index({ userId: 1, revokedAt: 1 });
APIKeySchema.index({ keyHash: 1 }, { unique: true });

export const APIKey: Model<IAPIKey> =
  mongoose.models.APIKey || mongoose.model<IAPIKey>('APIKey', APIKeySchema);

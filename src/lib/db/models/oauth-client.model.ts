import mongoose, { Schema, Model } from 'mongoose';
import type { IOAuthClient } from '@/types/db.types';

const OAuthClientSchema = new Schema<IOAuthClient>(
  {
    _id: { type: String, required: true },
    clientSecret: { type: String },
    clientName: { type: String, required: true, trim: true, maxlength: 200 },
    redirectUris: { type: [String], required: true },
    grantTypes: { type: [String], default: ['authorization_code', 'refresh_token'] },
    responseTypes: { type: [String], default: ['code'] },
    tokenEndpointAuthMethod: { type: String, default: 'none' },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const OAuthClient: Model<IOAuthClient> =
  mongoose.models.OAuthClient || mongoose.model<IOAuthClient>('OAuthClient', OAuthClientSchema);

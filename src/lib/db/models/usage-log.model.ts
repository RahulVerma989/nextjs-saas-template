import mongoose, { Schema, Model } from 'mongoose';
import type { IUsageLog } from '@/types/db.types';

const UsageLogSchema = new Schema<IUsageLog>(
  {
    _id: { type: String, required: true },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    apiKeyId: { type: String, required: true, ref: 'APIKey' },
    toolId: { type: String, required: true },
    windowDate: { type: String, required: true },
    requestCount: { type: Number, required: true, default: 0, min: 0 },
    lastRequestAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

UsageLogSchema.index({ userId: 1, windowDate: 1, toolId: 1 }, { unique: true });
UsageLogSchema.index({ apiKeyId: 1, windowDate: 1 });

export const UsageLog: Model<IUsageLog> =
  mongoose.models.UsageLog ||
  mongoose.model<IUsageLog>('UsageLog', UsageLogSchema);

import mongoose, { Schema, Model } from 'mongoose';
import type { IServiceRun } from '@/types/db.types';

const ServiceRunSchema = new Schema<IServiceRun>(
  {
    _id: { type: String, required: true },
    serviceId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: ['schedule', 'manual', 'webhook', 'api'],
      required: true,
    },
    workerId: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    duration: { type: Number },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    _id: false,
  }
);

ServiceRunSchema.index({ serviceId: 1, status: 1 });
ServiceRunSchema.index({ serviceId: 1, createdAt: -1 });
ServiceRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7-day TTL

export const ServiceRun: Model<IServiceRun> =
  mongoose.models.ServiceRun || mongoose.model<IServiceRun>('ServiceRun', ServiceRunSchema);

import mongoose, { Schema, Model } from 'mongoose';
import type { INotification, NotificationType } from '@/types/db.types';

const NotificationSchema = new Schema<INotification>(
  {
    _id: { type: String, required: true },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'info', 'success', 'warning', 'error',
        'low_credits', 'feedback_submitted', 'feedback_status_changed',
      ] as NotificationType[],
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    actionUrl: { type: String },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    _id: false,
  }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

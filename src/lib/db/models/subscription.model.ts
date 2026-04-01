import mongoose, { Schema, Model } from 'mongoose';
import type { ISubscription, SubscriptionStatus, Plan } from '@/types/db.types';

const SubscriptionPlanHistorySchema = new Schema(
  {
    plan: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'] as Exclude<Plan, 'free'>[],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    _id: { type: String, required: true },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      unique: true,
      index: true,
    },
    dodoSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    dodoCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'] as Exclude<Plan, 'free'>[],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'paused'] as SubscriptionStatus[],
      default: 'active',
      index: true,
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true, index: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    monthlyCredits: { type: Number, required: true, min: 0 },
    creditsAllocatedAt: { type: Date },
    planHistory: [SubscriptionPlanHistorySchema],
  },
  {
    timestamps: true,
    _id: false,
  }
);

SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

SubscriptionSchema.pre('save', function () {
  if (this.isModified('plan') && !this.isNew) {
    const lastHistory = this.planHistory[this.planHistory.length - 1];
    if (lastHistory && !lastHistory.endDate) {
      lastHistory.endDate = new Date();
    }
    this.planHistory.push({ plan: this.plan, startDate: new Date() });
  }
});

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

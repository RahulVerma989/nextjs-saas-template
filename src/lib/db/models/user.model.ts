import mongoose, { Schema, Model } from 'mongoose';
import type { IUser, Plan, UserRole } from '@/types/db.types';
import { siteConfig } from '@/config/site.config';

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subscriptionId: { type: String, ref: 'Subscription' },
    plan: {
      type: String,
      enum: ['free', 'early_adopter', 'starter', 'pro', 'enterprise'] as Plan[],
      default: 'free',
      index: true,
    },
    creditBalance: {
      type: Number,
      default: siteConfig.credits.signupBonus,
      min: 0,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    roles: {
      type: [String],
      enum: ['user', 'admin'] as UserRole[],
      default: ['user'],
      index: true,
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      timezone: { type: String, default: 'UTC' },
    },
    lastLoginAt: { type: Date },
    accountStatus: {
      type: String,
      enum: ['pending', 'pending_review', 'approved', 'rejected', 'waitlist'],
      default: 'pending',
      index: true,
    },
    qualification: {
      companyName: { type: String },
      websiteUrl: { type: String },
      contentVolume: { type: String },
      useCase: { type: String },
      useCaseOther: { type: String },
      monthlyBudget: { type: String },
      pricingCommitment: { type: String },
      howHeard: { type: String },
      xAccountUrl: { type: String },
      submittedAt: { type: Date },
    },
    approvedAt: { type: Date },
    approvedBy: { type: String },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

UserSchema.index({ createdAt: -1 });

UserSchema.virtual('displayName').get(function () {
  return this.name;
});

UserSchema.pre('save', function () {
  if (this.creditBalance < 0) this.creditBalance = 0;
  if (this.walletBalance < 0) this.walletBalance = 0;
});

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByGoogleId = function (googleId: string) {
  return this.findOne({ googleId });
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

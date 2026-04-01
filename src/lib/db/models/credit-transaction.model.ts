import mongoose, { Schema, Model } from 'mongoose';
import type { ICreditTransaction, CreditTransactionType, CreditSource } from '@/types/db.types';

const CreditTransactionMetadataSchema = new Schema(
  {
    description: { type: String },
  },
  { _id: false }
);

const CreditTransactionSchema = new Schema<ICreditTransaction>(
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
      enum: ['credit', 'debit'] as CreditTransactionType[],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: [
        'subscription', 'purchase', 'wallet_topup',
        'api_call', 'file_upload', 'export',
        'signup_bonus', 'monthly_refresh', 'refund', 'admin_adjustment',
      ] as CreditSource[],
      required: true,
      index: true,
    },
    referenceType: { type: String },
    referenceId: { type: String },
    metadata: { type: CreditTransactionMetadataSchema },
    createdAt: { type: Date, default: Date.now, immutable: true, index: true },
  },
  {
    timestamps: false,
    _id: false,
  }
);

CreditTransactionSchema.index({ userId: 1, createdAt: -1 });
CreditTransactionSchema.index({ userId: 1, source: 1, createdAt: -1 });

// Append-only ledger — prevent updates
CreditTransactionSchema.pre('findOneAndUpdate', function () {
  throw new Error('Credit transactions are immutable and cannot be updated');
});
CreditTransactionSchema.pre('updateOne', function () {
  throw new Error('Credit transactions are immutable and cannot be updated');
});
CreditTransactionSchema.pre('updateMany', function () {
  throw new Error('Credit transactions are immutable and cannot be updated');
});

export const CreditTransaction: Model<ICreditTransaction> =
  mongoose.models.CreditTransaction ||
  mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);

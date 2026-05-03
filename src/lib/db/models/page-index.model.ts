import mongoose, { Schema, Model } from 'mongoose';
import type { IPageIndex, PageIndexStatus } from '@/types/db.types';

/**
 * One PageIndex doc per route in indexable-routes.ts.  Tracks the
 * last contentHash we submitted to Google so we can detect changes
 * across deploys and re-submit only what's actually different.
 */
const PageIndexSchema = new Schema<IPageIndex>(
  {
    _id: { type: String, required: true },
    contentHash: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: [
        'pending',
        'submitted',
        'indexed',
        'not_indexed',
        'error',
      ] as PageIndexStatus[],
      default: 'pending',
      index: true,
    },
    submittedAt: { type: Date },
    inspectedAt: { type: Date },
    coverageState: { type: String },
    lastError: { type: String },
  },
  { timestamps: true, collection: 'page_index' },
);

export const PageIndex: Model<IPageIndex> =
  (mongoose.models.PageIndex as Model<IPageIndex>) ||
  mongoose.model<IPageIndex>('PageIndex', PageIndexSchema);

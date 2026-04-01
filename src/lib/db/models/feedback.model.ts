import mongoose, { Schema, Model } from 'mongoose';

export interface IFeedback {
  _id: string;
  userId: string;
  type: 'bug' | 'feedback' | 'suggestion' | 'error';
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  errorMessage?: string;
  toolName?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['bug', 'feedback', 'suggestion', 'error'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    stepsToReproduce: { type: String, trim: true, maxlength: 3000 },
    expectedBehavior: { type: String, trim: true, maxlength: 2000 },
    actualBehavior: { type: String, trim: true, maxlength: 2000 },
    errorMessage: { type: String, trim: true, maxlength: 2000 },
    toolName: { type: String, trim: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    metadata: { type: Schema.Types.Mixed },
    adminResponse: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'],
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

FeedbackSchema.index({ createdAt: -1 });

export const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

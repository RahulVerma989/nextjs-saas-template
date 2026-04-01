import mongoose, { Schema, Model } from 'mongoose';

interface IWaitlistEntry {
  email: string;
  joinedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlistEntry>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const WaitlistEntry: Model<IWaitlistEntry> =
  mongoose.models.WaitlistEntry || mongoose.model<IWaitlistEntry>('WaitlistEntry', WaitlistSchema);

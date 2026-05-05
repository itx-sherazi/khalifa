import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  link: string;
  status: 'new' | 'indexed';
  createdAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  link: { type: String, required: true },
  
  status: { type: String, enum: ['new', 'indexed'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
});

export default models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

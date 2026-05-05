import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  link: string;
  createdAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

import mongoose, { Schema, Document, models } from 'mongoose';

export interface IReceipt extends Document {
  userId: mongoose.Types.ObjectId;
  imageData: string; // Base64 or URL
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  imageData: { type: String, required: true }, // we can store base64 string
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);

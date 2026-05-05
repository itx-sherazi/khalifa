import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  tokens: number;
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tokens: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
}, { strict: true });

// Clear cached model to avoid stale schema errors (e.g. old 'country' field)
if (mongoose.connection.models['User']) {
  delete mongoose.connection.models['User'];
}

export default mongoose.models['User'] as mongoose.Model<IUser> ||
  mongoose.model<IUser>('User', UserSchema);

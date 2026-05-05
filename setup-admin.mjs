import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://binkhalifa248_db_user:lAs2KmLTvd0WNJKZ@cluster0.bx3fdd1.mongodb.net/khalifa_db?appName=Cluster0';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tokens: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

// Avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function setupAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    const adminEmail = 'Khalifa';
    
    // Check if it already exists and update password, otherwise create
    const existing = await User.findOne({ email: adminEmail });
    const hashedPassword = await bcrypt.hash('Khalifa@360', 10);

    if (existing) {
      existing.password = hashedPassword;
      await existing.save();
      console.log('Admin updated successfully!');
    } else {
      await User.create({
        name: 'Khalifa Admin',
        email: adminEmail,
        password: hashedPassword,
        tokens: 999999,
        role: 'admin',
      });
      console.log('Admin created successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupAdmin();

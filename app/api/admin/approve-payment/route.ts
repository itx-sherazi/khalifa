import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Receipt from '@/models/Receipt';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiptId } = await req.json();
    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const receipt = await Receipt.findById(receiptId);
    if (!receipt || receipt.status !== 'pending') {
      return NextResponse.json({ error: 'Invalid or already processed receipt' }, { status: 400 });
    }

    // Approve receipt
    receipt.status = 'approved';
    await receipt.save();

    // Add tokens
    const user = await User.findById(receipt.userId);
    if (user) {
      user.tokens += 1000;
      await user.save();
    }

    return NextResponse.json({ success: true, message: 'Tokens added successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error approving payment' }, { status: 500 });
  }
}

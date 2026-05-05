import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Receipt from '@/models/Receipt';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiptId, action } = await req.json();
    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const receipt = await Receipt.findById(receiptId);
    if (!receipt || receipt.status !== 'pending') {
      return NextResponse.json({ error: 'Invalid or already processed receipt' }, { status: 400 });
    }

    if (action === 'reject') {
      receipt.status = 'rejected';
      await receipt.save();
      return NextResponse.json({ success: true, message: 'Receipt rejected' });
    }

    // Default: approve
    receipt.status = 'approved';
    await receipt.save();

    const user = await User.findById(receipt.userId);
    if (user) {
      user.tokens += 1000;
      await user.save();
    }

    return NextResponse.json({ success: true, message: 'Tokens added successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error processing payment' }, { status: 500 });
  }
}

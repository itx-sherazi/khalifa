import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Receipt from '@/models/Receipt';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const receipts = await Receipt.find({ status: 'pending' }).populate('userId', 'name email').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, receipts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching receipts' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount } = await req.json();
    if (!userId || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid userId and amount required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { tokens: Number(amount) } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, newTokens: user.tokens });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error adding tokens' }, { status: 500 });
  }
}

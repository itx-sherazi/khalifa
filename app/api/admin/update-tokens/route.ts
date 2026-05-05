import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, tokens } = await req.json();
    const parsed = parseInt(tokens);
    
    if (!userId || isNaN(parsed) || parsed < 0) {
      return NextResponse.json({ error: 'Valid userId and token count required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { tokens: parsed } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, newTokens: user.tokens });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating tokens' }, { status: 500 });
  }
}

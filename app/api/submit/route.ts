import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Submission from '@/models/Submission';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { link } = await req.json();
    if (!link) {
      return NextResponse.json({ error: 'Link is required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.tokens <= 0) {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
    }

    // Deduct token
    user.tokens -= 1;
    await user.save();

    // Save submission
    await Submission.create({
      userId: user._id,
      link,
    });

    // Return random seconds (10-30) for fake loader
    const randomSeconds = Math.floor(Math.random() * (30 - 10 + 1)) + 10;

    return NextResponse.json({ success: true, randomSeconds, newTokens: user.tokens });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error submitting link' }, { status: 500 });
  }
}

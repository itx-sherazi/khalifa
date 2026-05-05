import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Submission from '@/models/Submission';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isValidUrl(url: string): boolean {
  try {
    // If it doesn't have a protocol, we'll test it as https
    const urlToTest = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(urlToTest);
    // Basic check: must have a protocol and a domain with at least one dot
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

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

    let finalLink = link.trim();
    if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
      finalLink = `https://${finalLink}`;
    }

    if (!isValidUrl(finalLink)) {
      return NextResponse.json({ error: 'Please enter a valid URL' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.tokens <= 0) {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
    }

    user.tokens -= 1;
    await user.save();

    await Submission.create({ userId: user._id, link: finalLink });

    const randomSeconds = Math.floor(Math.random() * (30 - 10 + 1)) + 10;

    return NextResponse.json({ success: true, randomSeconds, newTokens: user.tokens });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error submitting link' }, { status: 500 });
  }
}

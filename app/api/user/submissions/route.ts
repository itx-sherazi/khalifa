import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

    await connectToDatabase();
    const total = await Submission.countDocuments({ userId: session.id });
    const submissions = await Submission.find({ userId: session.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    return NextResponse.json({
      success: true,
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching submissions' }, { status: 500 });
  }
}

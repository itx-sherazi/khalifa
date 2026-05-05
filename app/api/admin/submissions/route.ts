import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const submissions = await Submission.find().populate('userId', 'name email').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching submissions' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Submission IDs required' }, { status: 400 });
    }

    await connectToDatabase();
    await Submission.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting submissions' }, { status: 500 });
  }
}

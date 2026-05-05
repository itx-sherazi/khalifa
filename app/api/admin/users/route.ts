import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Submission from '@/models/Submission';
import Receipt from '@/models/Receipt';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

    await connectToDatabase();
    const total = await User.countDocuments();
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    return NextResponse.json({ success: true, users, total, page, totalPages: Math.ceil(total / PAGE_SIZE) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching users' }, { status: 500 });
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
      return NextResponse.json({ error: 'User IDs required' }, { status: 400 });
    }

    await connectToDatabase();
    await User.deleteMany({ _id: { $in: ids } });
    await Submission.deleteMany({ userId: { $in: ids } });
    await Receipt.deleteMany({ userId: { $in: ids } });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting users' }, { status: 500 });
  }
}

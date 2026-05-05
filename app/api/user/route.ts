import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.id === 'admin_hardcoded_id') {
      return NextResponse.json({ 
        success: true, 
        user: { 
          name: 'Khalifa Admin', 
          email: 'Khalifa', 
          tokens: 1000, 
          role: 'admin' 
        } 
      });
    }

    await connectToDatabase();
    const user = await User.findById(session.id, '-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching user' }, { status: 500 });
  }
}

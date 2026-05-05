import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check for hardcoded admin credentials
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'khalifa' && password === 'Khalifa@360') {
      const token = signToken({ id: 'admin_hardcoded_id', role: 'admin' });
      const cookieStore = await cookies();
      cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

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

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const token = signToken({ id: user._id, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true, user: { name: user.name, email: user.email, tokens: user.tokens, role: user.role } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error logging in' }, { status: 500 });
  }
}

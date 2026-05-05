import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-khalifa-key-12345');

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; role: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  if (!token) {
    if (isDashboardPage || isAdminPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const session = await verifyToken(token);

  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  if (session.role === 'admin' && isDashboardPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (session.role !== 'admin' && isAdminPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL(session.role === 'admin' ? '/admin' : '/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup'],
};

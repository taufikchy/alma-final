import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/', '/login', '/api/auth'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/midwife')) {
    if (token.role !== 'MIDWIFE' && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/superadmin')) {
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/patient')) {
    if (token.role !== 'PATIENT') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (pathname.startsWith('/api/patients') && token.role !== 'MIDWIFE' && token.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (pathname.startsWith('/api/register-bidan') && token.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (pathname.startsWith('/api/midwives') && token.role !== 'MIDWIFE' && token.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (pathname.startsWith('/api/midwife-dailycheck') && token.role !== 'MIDWIFE' && token.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (pathname.startsWith('/api/dailycheck') && request.method === 'POST' && token.role !== 'PATIENT') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (pathname.startsWith('/api/patient-details') && token.role !== 'PATIENT') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/midwife/:path*',
    '/superadmin/:path*',
    '/patient/:path*',
    '/api/:path*',
  ],
};
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/', '/login', '/api/auth', '/favicon.ico', '/logo.png', '/manifest.json', '/sw.js'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan akses ke path publik dan file statis tanpa token
  if (
    publicPaths.some(path => pathname === path || pathname.startsWith(path)) ||
    pathname.includes('.') // Bypass untuk file dengan ekstensi (gambar, js, css)
  ) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Jika tidak ada token dan mencoba akses halaman terproteksi
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      // Hindari redirect loop jika sudah di login
      if (pathname !== '/login') {
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Role-based Access Control
    if (pathname.startsWith('/midwife')) {
      if (token.role !== 'MIDWIFE' && token.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/superadmin')) {
      if (token.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/patient')) {
      if (token.role !== 'PATIENT') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // API Route Protection
    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/patients') && token.role !== 'MIDWIFE' && token.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware Error]:', error);
    // Jika terjadi error pada middleware, biarkan request berlanjut agar tidak stuck di halaman error
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/midwife/:path*',
    '/superadmin/:path*',
    '/patient/:path*',
    '/api/:path*',
  ],
};
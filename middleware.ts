import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('adminAccessToken')?.value;



  // Check for admin token but allowing access "for now" as requested
  // Check for admin token but allowing access "for now" as requested
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname === '/') {

    if (!adminToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      return NextResponse.redirect(url);
    }
  }

  // Redirect to dashboard if already logged in and visiting /signin
  if (request.nextUrl.pathname.startsWith('/signin')) {
    if (adminToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/'; // Redirect to root (dashboard)
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matcher updated to apply to admin routes, root (dashboard), and signin
  matcher: ['/', '/admin/:path*', '/signin'],
};

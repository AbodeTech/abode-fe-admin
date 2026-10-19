import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { READ_ONLY } from '@/lib/read-only';

// Pages that only exist to write data, mapped to where a read-only admin lands instead
const WRITE_ONLY_ROUTES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^\/assets\/create-(flex|full-ownership)\/?$/, () => '/assets'],
  [/^\/assets\/(flex|fullownership)\/([^/]+)\/edit\/?$/, (m) => `/assets/${m[1]}/${m[2]}`],
  [/^\/agency\/new\/?$/, () => '/agency/lists'],
  [/^\/company-events\/new\/?$/, () => '/company-events'],
];

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('adminAccessToken')?.value;

  if (READ_ONLY) {
    for (const [pattern, target] of WRITE_ONLY_ROUTES) {
      const match = request.nextUrl.pathname.match(pattern);
      if (match) {
        const url = request.nextUrl.clone();
        url.pathname = target(match);
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
  }


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
  matcher: ['/', '/admin/:path*', '/signin', '/assets/:path*', '/agency/new', '/company-events/new'],
};

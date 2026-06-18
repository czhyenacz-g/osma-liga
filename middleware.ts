import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRequestCountry } from '@/lib/geo/getRequestCountry';
import { isEuCountry } from '@/lib/geo/euCountries';

const GAME_ROUTES = ['/satna', '/hra/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isGameRoute = GAME_ROUTES.some((prefix) => pathname.startsWith(prefix));
  if (!isGameRoute) return NextResponse.next();

  const country = getRequestCountry(request);
  if (isEuCountry(country)) return NextResponse.next();

  const blocked = request.nextUrl.clone();
  blocked.pathname = '/obecni-prebor';
  return NextResponse.redirect(blocked);
}

export const config = {
  matcher: ['/satna', '/hra/:path*'],
};

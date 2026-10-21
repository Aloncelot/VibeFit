import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/auth/token';

/**
 * Chequeo optimista: saca de /admin a quien no tenga una sesión firmada válida.
 * La autorización real se repite en cada página, consulta y Server Action (src/server/auth/dal.ts).
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!verifySessionToken(token)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('desde', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

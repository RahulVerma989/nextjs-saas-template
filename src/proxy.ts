import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy configuration for Next.js 16+
 * Runs in Edge Runtime — no Node.js APIs.
 *
 * Handles:
 * - Auth gating (session cookie check)
 * - Public route allowlisting
 * - Request logging
 */

// ─── Public paths (no session cookie required) ────────────────

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/pricing',
  '/features',
  '/privacy',
  '/terms',
  '/contact',
  '/api/auth',
  '/api/webhooks',
  '/api/og',
  '/api/mcp',
  '/api/oauth',
  '/.well-known',
];

const SKIP_LOG_PREFIXES = [
  '/_next/',
  '/favicon',
];

// ─── Helpers ──────────────────────────────────────────────────

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value
  );
}

function shouldLog(pathname: string): boolean {
  return !SKIP_LOG_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── Main proxy ───────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const start = Date.now();
  const { pathname } = request.nextUrl;
  const method = request.method;
  const sessionToken = getSessionToken(request);

  // Redirect authenticated users from login to dashboard
  if (pathname === '/login' && sessionToken) {
    logRequest(method, pathname, 302, start);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow public routes
  if (isPublicPath(pathname)) {
    logRequest(method, pathname, 200, start, 'public');
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !sessionToken) {
    logRequest(method, pathname, 302, start, 'unauthed→login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect API routes
  if (pathname.startsWith('/api') && !sessionToken) {
    logRequest(method, pathname, 401, start, 'no-session');
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      },
      { status: 401 }
    );
  }

  logRequest(method, pathname, 200, start);
  return NextResponse.next();
}

// ─── Request logger ───────────────────────────────────────────

function logRequest(
  method: string,
  pathname: string,
  status: number,
  startMs: number,
  note?: string
) {
  if (!shouldLog(pathname)) return;
  const durationMs = Date.now() - startMs;
  const noteStr = note ? ` [${note}]` : '';
  console.log(`[Proxy] ${method} ${pathname} ${status} ${durationMs}ms${noteStr}`);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

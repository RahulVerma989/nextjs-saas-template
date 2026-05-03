import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy configuration for Next.js 16+
 * Runs in Edge Runtime — no Node.js APIs.
 *
 * Handles:
 * - Scanner-probe blocking (drop bot traffic before any work)
 * - Auth gating (session cookie check)
 * - Public route allowlisting
 * - Request logging (method, path, status, duration)
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

const SKIP_LOG_PREFIXES = ['/_next/', '/favicon'];

// ─── Scanner probe blocking ───────────────────────────────────
// Automated bots constantly probe for misconfigured apps by hitting
// well-known exploit paths (`.env`, `phpinfo.php`, `/wp-admin`, etc.).
// None of these are legitimate for a Next.js app, so we return 404
// immediately from the edge — saving CPU, keeping logs clean, and
// never leaking auth status via redirects.

/** File extensions never used by a Next.js app. */
const BLOCKED_EXT_PATTERN =
  /\.(?:php|asp|aspx|jsp|jspx|env|bak|swp|old|save|sql|sqlite|pem|key|crt|htaccess|htpasswd)(?:$|\?)/i;

/** Dotfile paths that are common probe targets (anywhere in path). */
const BLOCKED_DOTFILE_PATTERN =
  /\/\.(?:env|git|aws|ssh|docker|htpasswd|htaccess)(?:$|\/|\.|~)/i;

/** WordPress, phpMyAdmin, and other well-known admin prefixes. */
const BLOCKED_PREFIX_PATTERN =
  /^\/(?:wp-admin|wp-content|wp-includes|wp-login|wp-config|phpmyadmin|pma|mysql|phpinfo|_phpinfo|administrator|cgi-bin)(?:\/|$)/i;

function isScannerProbe(pathname: string): boolean {
  return (
    BLOCKED_EXT_PATTERN.test(pathname) ||
    BLOCKED_DOTFILE_PATTERN.test(pathname) ||
    BLOCKED_PREFIX_PATTERN.test(pathname)
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
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

  // ─── Scanner probe blocking (fast-path) ────────────────────
  // Block bot traffic at the edge before any routing or auth work.
  if (isScannerProbe(pathname)) {
    logRequest(method, pathname, 404, start, 'scanner');
    return new NextResponse('Not Found', { status: 404 });
  }

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

  // Protect API routes (except public ones already handled above)
  if (pathname.startsWith('/api') && !sessionToken) {
    logRequest(method, pathname, 401, start, 'no-session');
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      },
      { status: 401 },
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
  note?: string,
) {
  if (!shouldLog(pathname)) return;
  const durationMs = Date.now() - startMs;
  const noteStr = note ? ` [${note}]` : '';
  console.log(`[Proxy] ${method} ${pathname} ${status} ${durationMs}ms${noteStr}`);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder image / manifest assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
};

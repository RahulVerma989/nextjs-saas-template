import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { siteConfig } from '@/config/site.config';
import {
  buildConsentUrl,
  getTargetHost,
  getApexHost,
} from '@/lib/services/gsc.service';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

/**
 * GET /api/integrations/gsc/connect
 *
 * Starts the OAuth consent flow for connecting Google Search Console.
 * Admin-only — only an admin should be wiring up site-wide indexing.
 *
 * Optional `?host=` query param picks which property to bind to:
 * the deployment host (default) or its apex domain.  Anything else
 * is rejected so the caller can't ask us to verify someone else's
 * domain.  The choice rides through the OAuth handshake in a
 * short-lived cookie so the callback can pass it to
 * `exchangeCodeAndStore`.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const isAdmin =
    siteConfig.adminEmails.includes((session.user.email ?? '').toLowerCase()) ||
    (session.user as { roles?: string[] }).roles?.includes('admin');
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }

  const target = getTargetHost();
  const apex = getApexHost(target);
  const requested = (req.nextUrl.searchParams.get('host') ?? '').toLowerCase();
  const chosenHost = requested === apex ? apex : target;

  const state = randomBytes(24).toString('hex');
  const jar = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600,
  };
  jar.set('gsc_oauth_state', state, cookieOpts);
  jar.set('gsc_target_host', chosenHost, cookieOpts);

  try {
    const url = buildConsentUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to build consent URL',
      },
      { status: 500 },
    );
  }
}

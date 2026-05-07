import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { siteConfig } from '@/config/site.config';
import { buildConsentUrl } from '@/lib/services/gsc.service';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

/**
 * GET /api/integrations/gsc/connect
 *
 * Starts the OAuth consent flow for connecting Google Search Console.
 * Admin-only — only an admin should be wiring up site-wide indexing.
 *
 * The CSRF state is stored in a short-lived signed cookie and
 * verified by the callback route.
 */
export async function GET() {
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

  const state = randomBytes(24).toString('hex');
  const jar = await cookies();
  jar.set('gsc_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });

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

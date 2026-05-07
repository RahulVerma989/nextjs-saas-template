import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { cookies } from 'next/headers';
import { exchangeCodeAndStore } from '@/lib/services/gsc.service';
import { siteConfig } from '@/config/site.config';

/**
 * GET /api/integrations/gsc/callback
 *
 * OAuth callback that exchanges the code for a refresh + access token,
 * picks the first verified Search Console property, and stores
 * everything in the singleton GSCConnection doc.
 *
 * All redirects use `siteConfig.url` as the base (instead of
 * `req.url`).  Inside a Dockerized standalone server the request URL
 * resolves to the internal bind address (e.g. `0.0.0.0:3000`), and if
 * the reverse proxy doesn't rewrite the Location header users land on
 * the unreachable internal host.  `siteConfig.url` is set at build
 * time from `NEXT_PUBLIC_APP_URL` and is always the canonical public
 * URL we want to send users to.
 */
export async function GET(req: NextRequest) {
  const base = siteConfig.url;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', base));
  }
  const isAdmin =
    siteConfig.adminEmails.includes((session.user.email ?? '').toLowerCase()) ||
    (session.user as { roles?: string[] }).roles?.includes('admin');
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', base));
  }

  const code = req.nextUrl.searchParams.get('code');
  const stateFromGoogle = req.nextUrl.searchParams.get('state');
  const errorFromGoogle = req.nextUrl.searchParams.get('error');

  const settingsUrl = new URL('/dashboard/settings/seo', base);

  if (errorFromGoogle) {
    settingsUrl.searchParams.set('gsc', `error:${errorFromGoogle}`);
    return NextResponse.redirect(settingsUrl);
  }

  const jar = await cookies();
  const expectedState = jar.get('gsc_oauth_state')?.value;
  jar.delete('gsc_oauth_state');

  if (!code || !stateFromGoogle || !expectedState || stateFromGoogle !== expectedState) {
    settingsUrl.searchParams.set('gsc', 'error:invalid_state');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    await exchangeCodeAndStore({ code, userId: session.user.id });
    settingsUrl.searchParams.set('gsc', 'connected');
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'connect_failed';
    settingsUrl.searchParams.set('gsc', `error:${encodeURIComponent(message)}`);
    return NextResponse.redirect(settingsUrl);
  }
}

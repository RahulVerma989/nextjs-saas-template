/**
 * Google Search Console + Indexing API helper.
 *
 * Wraps `googleapis` so the rest of the app doesn't have to know about
 * OAuth refresh, scopes, or the difference between Web Search Indexing
 * and the Search Console URL inspection API.
 *
 * Required scopes (configure on the OAuth consent screen):
 *   - https://www.googleapis.com/auth/webmasters
 *   - https://www.googleapis.com/auth/indexing
 */

import { google } from 'googleapis';
import { connectDB } from '@/lib/db/connection';
import { GSCConnection, GSC_CONNECTION_ID } from '@/lib/db/models';
import { siteConfig } from '@/config/site.config';
import type { OAuth2Client } from 'google-auth-library';
import type { IGSCConnection } from '@/types/db.types';

export const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/indexing',
] as const;

export const GSC_REDIRECT_URI = `${siteConfig.url}/api/integrations/gsc/callback`;

export function buildOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET must be set to use GSC integration.',
    );
  }
  return new google.auth.OAuth2({
    clientId,
    clientSecret,
    redirectUri: GSC_REDIRECT_URI,
  });
}

/** Generate the consent URL for the SEO settings "Connect" button. */
export function buildConsentUrl(state: string): string {
  const oauth = buildOAuthClient();
  return oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force refresh_token even if previously granted
    scope: [...GSC_SCOPES],
    state,
    include_granted_scopes: true,
  });
}

/**
 * Exchange the OAuth code for tokens.  The site URL is picked
 * automatically as the first verified property — admins can change
 * it later in the UI by reconnecting against a different property.
 */
export async function exchangeCodeAndStore(args: {
  code: string;
  userId: string;
  preferredSiteUrl?: string;
}): Promise<IGSCConnection> {
  const oauth = buildOAuthClient();
  const { tokens } = await oauth.getToken(args.code);
  if (!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date) {
    throw new Error(
      'Google did not return a refresh_token. Did you set prompt=consent and access_type=offline?',
    );
  }
  oauth.setCredentials(tokens);

  // Pick the property to track: prefer the user-supplied URL if it's
  // verified; otherwise fall back to the first verified one Google
  // returns.  Without a verified property, indexing calls will 403.
  const sites = await google
    .webmasters({ version: 'v3', auth: oauth })
    .sites.list();
  const verified =
    sites.data.siteEntry?.filter(
      (s) => s.permissionLevel && s.permissionLevel !== 'siteUnverifiedUser',
    ) ?? [];
  if (verified.length === 0) {
    throw new Error(
      'No verified Search Console properties found for this Google account. ' +
        'Verify your site in https://search.google.com/search-console first.',
    );
  }
  const chosen =
    (args.preferredSiteUrl &&
      verified.find((v) => v.siteUrl === args.preferredSiteUrl)?.siteUrl) ||
    verified[0].siteUrl!;

  await connectDB();
  const conn = await GSCConnection.findByIdAndUpdate(
    GSC_CONNECTION_ID,
    {
      _id: GSC_CONNECTION_ID,
      siteUrl: chosen,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      accessTokenExpiresAt: new Date(tokens.expiry_date),
      scopes: tokens.scope?.split(' ') ?? [...GSC_SCOPES],
      connectedByUserId: args.userId,
      connectedAt: new Date(),
      lastError: undefined,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<IGSCConnection>();

  if (!conn) throw new Error('Failed to persist GSC connection');
  return conn;
}

export async function getConnection(): Promise<IGSCConnection | null> {
  await connectDB();
  return GSCConnection.findById(GSC_CONNECTION_ID).lean<IGSCConnection>();
}

export async function disconnect(): Promise<void> {
  await connectDB();
  await GSCConnection.deleteOne({ _id: GSC_CONNECTION_ID });
}

/**
 * Build an authenticated OAuth2 client from the stored connection,
 * refreshing the access token if it's expired.
 */
async function getAuthedClient(): Promise<{ auth: OAuth2Client; conn: IGSCConnection }> {
  const conn = await getConnection();
  if (!conn) throw new Error('GSC is not connected');

  const oauth = buildOAuthClient();
  oauth.setCredentials({
    refresh_token: conn.refreshToken,
    access_token: conn.accessToken,
    expiry_date: new Date(conn.accessTokenExpiresAt).getTime(),
  });

  // googleapis automatically refreshes when expiry_date is past, but
  // we persist the refreshed token so other replicas don't burn through
  // refresh quota.
  oauth.on('tokens', (newTokens) => {
    if (newTokens.access_token && newTokens.expiry_date) {
      void connectDB().then(() =>
        GSCConnection.updateOne(
          { _id: GSC_CONNECTION_ID },
          {
            accessToken: newTokens.access_token,
            accessTokenExpiresAt: new Date(newTokens.expiry_date!),
            lastUsedAt: new Date(),
          },
        ),
      );
    }
  });

  return { auth: oauth, conn };
}

/**
 * Submit a URL_UPDATED notification to the Indexing API.
 * Returns the timestamp Google recorded for the notification.
 */
export async function submitUrlUpdated(url: string): Promise<Date> {
  const { auth } = await getAuthedClient();
  const indexing = google.indexing({ version: 'v3', auth });
  const res = await indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_UPDATED' },
  });
  return new Date(res.data.urlNotificationMetadata?.latestUpdate?.notifyTime ?? Date.now());
}

/** Submit a URL_DELETED notification (for removed marketing pages). */
export async function submitUrlDeleted(url: string): Promise<Date> {
  const { auth } = await getAuthedClient();
  const indexing = google.indexing({ version: 'v3', auth });
  const res = await indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_DELETED' },
  });
  return new Date(res.data.urlNotificationMetadata?.latestRemove?.notifyTime ?? Date.now());
}

/** Inspect a URL's coverage state via the Search Console URL Inspection API. */
export async function inspectUrl(url: string): Promise<{
  coverageState?: string;
  indexed: boolean;
}> {
  const { auth, conn } = await getAuthedClient();
  const sc = google.searchconsole({ version: 'v1', auth });
  const res = await sc.urlInspection.index.inspect({
    requestBody: { inspectionUrl: url, siteUrl: conn.siteUrl },
  });
  const verdict = res.data.inspectionResult?.indexStatusResult?.verdict;
  const coverageState = res.data.inspectionResult?.indexStatusResult?.coverageState;
  return {
    coverageState: coverageState ?? undefined,
    indexed: verdict === 'PASS',
  };
}

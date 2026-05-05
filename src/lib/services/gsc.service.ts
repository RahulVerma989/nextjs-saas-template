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

/** The host portion of `siteConfig.url`, e.g. "template.rahulverma.cc". */
export function getTargetHost(): string {
  try {
    return new URL(siteConfig.url).hostname.toLowerCase();
  } catch {
    return 'localhost';
  }
}

/**
 * Build the prioritised list of GSC property identifiers we'd accept
 * for a given host.  Domain properties (`sc-domain:…`) cover all
 * subdomains and protocols, so we accept the exact host AND any
 * registrable parent (e.g. for `template.rahulverma.cc` we'll also
 * match `sc-domain:rahulverma.cc`).  URL-prefix properties are tried
 * with and without `www.` and across both protocols.
 */
function getDomainCandidates(host: string): string[] {
  const stripped = host.replace(/^www\./, '').toLowerCase();
  const parts = stripped.split('.');

  // Walk up the hierarchy: e.g. template.rahulverma.cc -> ['template.rahulverma.cc', 'rahulverma.cc']
  // Stop before we hit a single-label TLD (don't match `sc-domain:cc`).
  const domainParents: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    domainParents.push(parts.slice(i).join('.'));
  }

  const candidates = new Set<string>();
  for (const parent of domainParents) {
    candidates.add(`sc-domain:${parent}`);
  }
  candidates.add(`https://${stripped}/`);
  candidates.add(`https://www.${stripped}/`);
  candidates.add(`http://${stripped}/`);
  candidates.add(`http://www.${stripped}/`);
  return Array.from(candidates);
}

/**
 * Find the GSC property that matches `host`, ordered by preference.
 * Returns `null` if the user has nothing verified for the domain.
 *
 * Permission level filter: we only consider properties where the
 * caller is verified — `siteUnverifiedUser` properties cause every
 * subsequent indexing/inspection call to 403 with "User not verified".
 */
export function findVerifiedSiteForHost(
  sites: Array<{ siteUrl?: string | null; permissionLevel?: string | null }>,
  host: string,
): string | null {
  const candidates = getDomainCandidates(host);
  for (const candidate of candidates) {
    const match = sites.find(
      (s) =>
        (s.siteUrl ?? '').toLowerCase() === candidate &&
        s.permissionLevel &&
        s.permissionLevel !== 'siteUnverifiedUser',
    );
    if (match?.siteUrl) return match.siteUrl;
  }
  return null;
}

/**
 * Attempt to add a GSC property for `host`.  Tries the apex
 * `sc-domain:` form first (covers all subdomains + protocols, the
 * pattern Quillly uses) and falls back to a URL-prefix property if
 * the domain form is rejected.
 *
 * Adding doesn't verify ownership — the property will land in
 * `siteUnverifiedUser` state until the user proves ownership in
 * Search Console.  We don't auto-verify here because verification
 * needs DNS/HTML control we may not have on the deployment domain.
 */
async function addGSCSite(oauth: OAuth2Client, host: string): Promise<string> {
  const stripped = host.replace(/^www\./, '');
  const webmasters = google.webmasters({ version: 'v3', auth: oauth });

  const domainSiteUrl = `sc-domain:${stripped}`;
  try {
    await webmasters.sites.add({ siteUrl: domainSiteUrl });
    return domainSiteUrl;
  } catch {
    // Domain property may be rejected (no DNS verification path);
    // fall through to URL-prefix.
  }

  const urlSiteUrl = `https://${stripped}/`;
  await webmasters.sites.add({ siteUrl: urlSiteUrl });
  return urlSiteUrl;
}

/**
 * Exchange the OAuth code for tokens and persist the connection.
 *
 * Property selection (Quillly-style):
 *   1. List the user's GSC properties.
 *   2. Prefer the verified property whose host matches `siteConfig.url`
 *      (sc-domain first, walking up parents, then URL-prefix variants).
 *   3. If a `preferredSiteUrl` is supplied AND it's verified, that wins.
 *   4. If nothing verified matches the deployment domain, we DON'T
 *      silently pick someone else's domain — that's how the template
 *      ended up connected to `sc-domain:ringtrue.app`.  Instead we
 *      surface a precise error pointing at the host we're looking for.
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

  const sites = await google
    .webmasters({ version: 'v3', auth: oauth })
    .sites.list();
  const allSites = sites.data.siteEntry ?? [];
  const verified = allSites.filter(
    (s) => s.permissionLevel && s.permissionLevel !== 'siteUnverifiedUser',
  );

  const host = getTargetHost();
  let chosen: string | null = null;

  // 1. Caller override (e.g. admin re-picking from a dropdown later).
  if (args.preferredSiteUrl) {
    const match = verified.find((v) => v.siteUrl === args.preferredSiteUrl);
    if (match?.siteUrl) chosen = match.siteUrl;
  }

  // 2. Match by deployment host.
  if (!chosen) {
    chosen = findVerifiedSiteForHost(verified, host);
  }

  if (!chosen) {
    if (verified.length === 0) {
      throw new Error(
        `No verified Search Console properties found on this Google account. ` +
          `Add and verify "${host}" (or its apex domain) at ` +
          `https://search.google.com/search-console first.`,
      );
    }

    const have = verified
      .map((s) => s.siteUrl)
      .filter(Boolean)
      .join(', ');
    throw new Error(
      `None of your verified Search Console properties match ${host}. ` +
        `This account is verified for: ${have}. ` +
        `Add and verify "${host}" (or its apex) in Search Console, then retry.`,
    );
  }

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

/**
 * List every GSC property the user has access to.  Used by the
 * settings UI to let admins re-pick if the auto-match got it wrong.
 */
export async function listSites(): Promise<
  Array<{ siteUrl: string; permissionLevel: string; verified: boolean }>
> {
  const { auth } = await getAuthedClient();
  const res = await google.webmasters({ version: 'v3', auth }).sites.list();
  return (res.data.siteEntry ?? []).map((s) => ({
    siteUrl: s.siteUrl ?? '',
    permissionLevel: s.permissionLevel ?? 'siteUnverifiedUser',
    verified:
      !!s.permissionLevel && s.permissionLevel !== 'siteUnverifiedUser',
  }));
}

/**
 * Switch the active GSC property for an already-connected account.
 * Validates that the user is verified on `siteUrl` before saving.
 */
export async function setActiveSite(siteUrl: string): Promise<IGSCConnection> {
  const sites = await listSites();
  const match = sites.find((s) => s.siteUrl === siteUrl && s.verified);
  if (!match) {
    throw new Error(
      `${siteUrl} is not a verified property on this Google account.`,
    );
  }
  await connectDB();
  const conn = await GSCConnection.findByIdAndUpdate(
    GSC_CONNECTION_ID,
    { siteUrl, lastError: undefined },
    { new: true },
  ).lean<IGSCConnection>();
  if (!conn) throw new Error('GSC is not connected');
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

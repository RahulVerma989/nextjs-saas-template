/**
 * Google Search Console + Indexing API + Site Verification helper.
 *
 * Wraps `googleapis` so the rest of the app doesn't have to know about
 * OAuth refresh, scopes, or the difference between the GSC, Indexing,
 * and Site Verification APIs.
 *
 * Required scopes (configure on the OAuth consent screen):
 *   - https://www.googleapis.com/auth/webmasters
 *   - https://www.googleapis.com/auth/indexing
 *   - https://www.googleapis.com/auth/siteverification
 */

import { google } from 'googleapis';
import { connectDB } from '@/lib/db/connection';
import { GSCConnection, GSC_CONNECTION_ID } from '@/lib/db/models';
import { siteConfig } from '@/config/site.config';
import type { OAuth2Client } from 'google-auth-library';
import type { IGSCConnection, GSCVerificationMethod } from '@/types/db.types';

export const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/indexing',
  'https://www.googleapis.com/auth/siteverification',
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

export function buildConsentUrl(state: string): string {
  const oauth = buildOAuthClient();
  return oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
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

type SiteEntry = { siteUrl?: string | null; permissionLevel?: string | null };

/**
 * Find the GSC property that matches `host`, ordered by preference.
 * If `requireVerified` is true, returns null when nothing verified
 * matches (used for "is this really set up?" checks).  Otherwise
 * returns the first matching siteUrl regardless of verification —
 * useful when we just added the property and need its identifier.
 */
export function findSiteForHost(
  sites: SiteEntry[],
  host: string,
  requireVerified = true,
): string | null {
  const candidates = getDomainCandidates(host);
  for (const candidate of candidates) {
    const match = sites.find((s) => {
      if ((s.siteUrl ?? '').toLowerCase() !== candidate) return false;
      if (!requireVerified) return true;
      return !!s.permissionLevel && s.permissionLevel !== 'siteUnverifiedUser';
    });
    if (match?.siteUrl) return match.siteUrl;
  }
  return null;
}

/** Back-compat alias — old callers pass already-filtered verified sites. */
export function findVerifiedSiteForHost(
  sites: SiteEntry[],
  host: string,
): string | null {
  return findSiteForHost(sites, host, true);
}

/**
 * Add a GSC property for `host`.  Tries `sc-domain:` first (covers
 * subdomains + protocols) and falls back to URL-prefix if Google
 * rejects the domain form (e.g. account can't add domain properties).
 */
export async function addGSCSite(
  oauth: OAuth2Client,
  host: string,
): Promise<string> {
  const stripped = host.replace(/^www\./, '');
  const webmasters = google.webmasters({ version: 'v3', auth: oauth });

  const domainSiteUrl = `sc-domain:${stripped}`;
  try {
    await webmasters.sites.add({ siteUrl: domainSiteUrl });
    return domainSiteUrl;
  } catch {
    // Domain property may be rejected; fall through.
  }

  const urlSiteUrl = `https://${stripped}/`;
  await webmasters.sites.add({ siteUrl: urlSiteUrl });
  return urlSiteUrl;
}

/**
 * Find or create the GSC property for `host`.  Returns:
 *   - `siteUrl`  : the property identifier we'll save
 *   - `verified` : whether the user is verified on it right now
 *   - `created`  : whether we just added it (verification still needed)
 */
async function findOrCreateSiteForHost(
  oauth: OAuth2Client,
  host: string,
): Promise<{ siteUrl: string; verified: boolean; created: boolean }> {
  const webmasters = google.webmasters({ version: 'v3', auth: oauth });
  const list = await webmasters.sites.list();
  const sites = list.data.siteEntry ?? [];

  const verified = findSiteForHost(sites, host, true);
  if (verified) return { siteUrl: verified, verified: true, created: false };

  // Maybe the user has it but unverified — we'll surface that as-is so
  // the verify flow can pick up where they left off.
  const anyMatch = findSiteForHost(sites, host, false);
  if (anyMatch) return { siteUrl: anyMatch, verified: false, created: false };

  // Nothing for this host — try to add it.
  const created = await addGSCSite(oauth, host);
  return { siteUrl: created, verified: false, created: true };
}

/**
 * Exchange the OAuth code for tokens and persist the connection.
 *
 * If the user has a verified property for `siteConfig.url`'s host, we
 * pick it.  Otherwise we (a) auto-create the property in their GSC
 * account, (b) save the connection in `verified=false` state, and
 * (c) let the SEO settings UI guide them through verification.
 */
export async function exchangeCodeAndStore(args: {
  code: string;
  userId: string;
}): Promise<IGSCConnection> {
  const oauth = buildOAuthClient();
  const { tokens } = await oauth.getToken(args.code);
  if (!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date) {
    throw new Error(
      'Google did not return a refresh_token. Did you set prompt=consent and access_type=offline?',
    );
  }
  oauth.setCredentials(tokens);

  const host = getTargetHost();
  const { siteUrl, verified } = await findOrCreateSiteForHost(oauth, host);

  await connectDB();
  const conn = await GSCConnection.findByIdAndUpdate(
    GSC_CONNECTION_ID,
    {
      _id: GSC_CONNECTION_ID,
      siteUrl,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      accessTokenExpiresAt: new Date(tokens.expiry_date),
      scopes: tokens.scope?.split(' ') ?? [...GSC_SCOPES],
      connectedByUserId: args.userId,
      connectedAt: new Date(),
      verified,
      lastError: undefined,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<IGSCConnection>();

  if (!conn) throw new Error('Failed to persist GSC connection');
  return conn;
}

/**
 * List every GSC property the connected account has access to.
 * Used by the settings UI to populate the property switcher.
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

/** Switch the active property — only verified targets allowed. */
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
    { siteUrl, verified: true, lastError: undefined },
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
 * Refresh `verified` from GSC — call this on the settings page render
 * so the UI flips to "verified" the moment Google approves the proof.
 */
export async function refreshVerificationStatus(): Promise<IGSCConnection | null> {
  const conn = await getConnection();
  if (!conn) return null;

  try {
    const { auth } = await getAuthedClient();
    const list = await google.webmasters({ version: 'v3', auth }).sites.list();
    const sites = list.data.siteEntry ?? [];
    const match = sites.find((s) => s.siteUrl === conn.siteUrl);
    const verified =
      !!match?.permissionLevel &&
      match.permissionLevel !== 'siteUnverifiedUser';
    if (verified !== !!conn.verified) {
      await connectDB();
      return GSCConnection.findByIdAndUpdate(
        GSC_CONNECTION_ID,
        { verified },
        { new: true },
      ).lean<IGSCConnection>();
    }
    return conn;
  } catch {
    return conn;
  }
}

// ─── Site verification ────────────────────────────────────────

/**
 * Extract the bare `content="..."` value from a META verification token.
 *
 * Google returns the *full* HTML meta tag for METHOD=META, but Next.js's
 * `metadata.verification.google` wraps whatever you pass in its own
 * meta element — passing the full tag produces a doubly-wrapped, HTML-
 * escaped tag that Google's crawler can't match.
 */
export function extractMetaContent(token: string): string {
  if (!token) return token;
  const match = token.match(/content\s*=\s*["']([^"']+)["']/i);
  return match ? match[1] : token;
}

function siteForVerification(host: string, method: GSCVerificationMethod) {
  const stripped = host.replace(/^www\./, '');
  if (method === 'DNS_TXT') {
    return { type: 'INET_DOMAIN' as const, identifier: stripped };
  }
  return { type: 'SITE' as const, identifier: `https://${stripped}/` };
}

/**
 * Fetch a verification token from Google for the chosen method and
 * persist the relevant fields on the connection so the settings UI
 * (and metadata.verification.google) can render them.
 */
export async function fetchVerificationToken(
  method: GSCVerificationMethod,
): Promise<IGSCConnection> {
  const { auth } = await getAuthedClient();
  const host = getTargetHost();
  const stripped = host.replace(/^www\./, '');
  const sv = google.siteVerification({ version: 'v1', auth });

  const res = await sv.webResource.getToken({
    requestBody: {
      site: siteForVerification(host, method),
      verificationMethod: method,
    },
  });
  const rawToken = res.data.token ?? '';
  if (!rawToken) {
    throw new Error('Google did not return a verification token. Try a different method.');
  }

  const update: Partial<IGSCConnection> = { verificationMethod: method };
  if (method === 'META') {
    update.verificationMetaToken = extractMetaContent(rawToken);
    update.verificationFileName = undefined;
    update.verificationFileContent = undefined;
    update.verificationDnsRecord = undefined;
  } else if (method === 'FILE') {
    update.verificationFileName = rawToken;
    update.verificationFileContent = `google-site-verification: ${rawToken}`;
    update.verificationMetaToken = undefined;
    update.verificationDnsRecord = undefined;
  } else {
    update.verificationDnsRecord = rawToken;
    update.verificationMetaToken = undefined;
    update.verificationFileName = undefined;
    update.verificationFileContent = undefined;
  }
  // Mongoose doesn't unset fields when given `undefined` via update —
  // strip them out and use $unset for fields we want to clear.
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ''> = {};
  for (const [k, v] of Object.entries(update)) {
    if (v === undefined) $unset[k] = '';
    else $set[k] = v;
  }

  await connectDB();
  const conn = await GSCConnection.findByIdAndUpdate(
    GSC_CONNECTION_ID,
    { $set, $unset },
    { new: true },
  ).lean<IGSCConnection>();
  if (!conn) throw new Error('GSC is not connected');
  void stripped;
  return conn;
}

/**
 * Ask Google to verify ownership using the chosen method.  The token
 * must already be live on the user's site/DNS — this just kicks off
 * Google's check.  Returns the (now possibly verified) connection.
 */
export async function runVerification(
  method: GSCVerificationMethod,
): Promise<{ verified: boolean; error?: string; conn: IGSCConnection | null }> {
  const { auth } = await getAuthedClient();
  const host = getTargetHost();
  const sv = google.siteVerification({ version: 'v1', auth });
  try {
    await sv.webResource.insert({
      verificationMethod: method,
      requestBody: { site: siteForVerification(host, method) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    await connectDB();
    await GSCConnection.findByIdAndUpdate(GSC_CONNECTION_ID, {
      lastError: message,
    });
    const conn = await getConnection();
    return { verified: false, error: message, conn };
  }

  const conn = await refreshVerificationStatus();
  return { verified: !!conn?.verified, conn };
}

// ─── Indexing API ─────────────────────────────────────────────

async function getAuthedClient(): Promise<{ auth: OAuth2Client; conn: IGSCConnection }> {
  const conn = await getConnection();
  if (!conn) throw new Error('GSC is not connected');

  const oauth = buildOAuthClient();
  oauth.setCredentials({
    refresh_token: conn.refreshToken,
    access_token: conn.accessToken,
    expiry_date: new Date(conn.accessTokenExpiresAt).getTime(),
  });

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

export async function submitUrlUpdated(url: string): Promise<Date> {
  const { auth } = await getAuthedClient();
  const indexing = google.indexing({ version: 'v3', auth });
  const res = await indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_UPDATED' },
  });
  return new Date(res.data.urlNotificationMetadata?.latestUpdate?.notifyTime ?? Date.now());
}

export async function submitUrlDeleted(url: string): Promise<Date> {
  const { auth } = await getAuthedClient();
  const indexing = google.indexing({ version: 'v3', auth });
  const res = await indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_DELETED' },
  });
  return new Date(res.data.urlNotificationMetadata?.latestRemove?.notifyTime ?? Date.now());
}

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

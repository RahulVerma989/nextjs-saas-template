'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Circle,
} from 'lucide-react';

type Method = 'META' | 'FILE' | 'DNS_TXT';

interface SiteOption {
  siteUrl: string;
  permissionLevel: string;
  verified: boolean;
}

interface Verification {
  method: Method | null;
  host: string | null;
  metaToken: string | null;
  fileName: string | null;
  fileContent: string | null;
  dnsRecord: string | null;
}

interface Props {
  connected: boolean;
  siteUrl: string | null;
  targetHost: string;
  apexHost: string;
  connectedAt: string | null;
  lastUsedAt: string | null;
  lastError: string | null;
  verified: boolean;
  verification: Verification;
  readOnly: boolean;
  gcpClientConfigured: boolean;
  redirectUri: string;
}

const REQUIRED_APIS = [
  {
    name: 'Search Console API',
    apiId: 'searchconsole.googleapis.com',
    why: 'List + switch properties; URL Inspection',
  },
  {
    name: 'Web Search Indexing API',
    apiId: 'indexing.googleapis.com',
    why: 'URL_UPDATED / URL_DELETED submissions',
  },
  {
    name: 'Site Verification API',
    apiId: 'siteverification.googleapis.com',
    why: 'Auto-fetch verification token + ask Google to verify',
  },
];

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/indexing',
  'https://www.googleapis.com/auth/siteverification',
];

export function GSCSettingsClient(props: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState<'disconnect' | 'switch' | 'fetch' | 'verify' | null>(null);
  const [sites, setSites] = useState<SiteOption[] | null>(null);
  const [sitesLoaded, setSitesLoaded] = useState(false);
  const [method, setMethod] = useState<Method>(props.verification.method ?? 'META');
  const hasSubdomain = props.targetHost !== props.apexHost;
  const initialVerifyApex = (() => {
    if (props.verification.host) return props.verification.host === props.apexHost;
    if (props.siteUrl?.startsWith(`sc-domain:${props.apexHost}`)) return true;
    return false;
  })();
  const [verifyApex, setVerifyApex] = useState<boolean>(initialVerifyApex);
  const verifyHost = verifyApex ? props.apexHost : props.targetHost;
  const [connectApex, setConnectApex] = useState<boolean>(false);
  const connectHost = connectApex ? props.apexHost : props.targetHost;
  // Setup checklist is open by default until everything is verified.
  const [checklistOpen, setChecklistOpen] = useState<boolean>(!props.verified);

  useEffect(() => {
    const status = search.get('gsc');
    if (!status) return;
    if (status === 'connected') {
      setBanner({
        kind: 'success',
        text: props.verified
          ? 'Search Console connected and verified.'
          : 'Search Console connected. Now verify ownership of the property below.',
      });
    } else if (status.startsWith('error:')) {
      const reason = decodeURIComponent(status.slice('error:'.length));
      setBanner({ kind: 'error', text: `Couldn't connect: ${reason}` });
    }
  }, [search, props.verified]);

  useEffect(() => {
    if (!props.connected || sitesLoaded) return;
    setSitesLoaded(true);
    fetch('/api/integrations/gsc/sites')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSites(data.data.sites);
      })
      .catch(() => {});
  }, [props.connected, sitesLoaded]);

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Search Console? Submitted pages will stop receiving updates until you reconnect.')) return;
    setBusy('disconnect');
    try {
      const res = await fetch('/api/integrations/gsc', { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else setBanner({ kind: 'error', text: 'Failed to disconnect.' });
    } finally {
      setBusy(null);
    }
  };

  const handleSwitchSite = async (newSiteUrl: string) => {
    if (newSiteUrl === props.siteUrl) return;
    setBusy('switch');
    setBanner(null);
    try {
      const res = await fetch('/api/integrations/gsc/sites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: newSiteUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ kind: 'success', text: `Switched to ${newSiteUrl}.` });
        router.refresh();
      } else {
        setBanner({ kind: 'error', text: data.error ?? 'Switch failed' });
      }
    } finally {
      setBusy(null);
    }
  };

  const handleFetchToken = async (m: Method, host = verifyHost) => {
    setBusy('fetch');
    setBanner(null);
    try {
      const res = await fetch(
        `/api/integrations/gsc/verify?method=${m}&host=${encodeURIComponent(host)}`,
      );
      const data = await res.json();
      if (data.success) {
        setMethod(m);
        setBanner({
          kind: 'info',
          text: `Fetched a fresh ${m} token for ${host}. Place it on your site, then click Verify ownership.`,
        });
        router.refresh();
      } else {
        setBanner({ kind: 'error', text: data.error ?? 'Failed to fetch token' });
      }
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    setBusy('verify');
    setBanner(null);
    try {
      const res = await fetch('/api/integrations/gsc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ kind: 'success', text: 'Ownership verified! You can now run page-indexing.' });
        router.refresh();
      } else {
        setBanner({ kind: 'error', text: data.error ?? 'Verification failed' });
      }
    } finally {
      setBusy(null);
    }
  };

  const verifiedSites = (sites ?? []).filter((s) => s.verified);

  // Checklist progress (4 items).
  const checklistDone =
    [props.gcpClientConfigured, props.connected, props.verified, true].filter(Boolean).length;

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">SEO &amp; Search Console</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Auto-submit changed marketing pages to Google&apos;s Indexing API. Per-page status:{' '}
          <Link href="/dashboard/admin/page-indexing" className="underline">
            Page Indexing
          </Link>
          .
        </p>
      </div>

      {banner && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            banner.kind === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
              : banner.kind === 'info'
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {banner.text}
        </div>
      )}

      <SetupChecklist
        open={checklistOpen}
        onToggle={() => setChecklistOpen((v) => !v)}
        gcpClientConfigured={props.gcpClientConfigured}
        connected={props.connected}
        verified={props.verified}
        redirectUri={props.redirectUri}
        done={checklistDone}
      />

      {/* ── Connection card ──────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Google Search Console</h2>
          {props.connected && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                props.verified
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-700 dark:text-yellow-400'
              }`}
            >
              {props.verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {props.verified ? 'Verified' : 'Awaiting verification'}
            </span>
          )}
        </div>

        {props.connected ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <Field label="Property" value={props.siteUrl ?? '—'} mono />
              <Field
                label="Connected"
                value={props.connectedAt ? new Date(props.connectedAt).toLocaleString() : '—'}
              />
              <Field
                label="Last used"
                value={props.lastUsedAt ? new Date(props.lastUsedAt).toLocaleString() : 'Never'}
              />
              {props.lastError && (
                <Field label="Last error" value={props.lastError} className="text-destructive" />
              )}
            </div>

            {verifiedSites.length > 1 && (
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Switch property
                </label>
                <select
                  disabled={props.readOnly || busy !== null}
                  value={props.siteUrl ?? ''}
                  onChange={(e) => handleSwitchSite(e.target.value)}
                  className="mt-1 w-full sm:w-96 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifiedSites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl}>
                      {s.siteUrl}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`/api/integrations/gsc/connect?host=${encodeURIComponent(
                  (props.siteUrl ?? props.targetHost)
                    .replace(/^sc-domain:/, '')
                    .replace(/^https?:\/\//, '')
                    .replace(/\/$/, ''),
                )}`}
                className="border border-border px-3 py-1.5 rounded-md text-xs font-medium hover:bg-accent transition-colors"
              >
                Reconnect
              </a>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={props.readOnly || busy !== null}
                className="text-destructive border border-destructive/30 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Sign in with the Google account that owns the property for{' '}
              <code className="font-mono">{props.targetHost}</code>.
            </p>

            {hasSubdomain && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Connect against
                </div>
                <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setConnectApex(false)}
                    className={`px-3 py-1.5 transition-colors ${
                      !connectApex ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                    }`}
                  >
                    Subdomain ({props.targetHost})
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectApex(true)}
                    className={`px-3 py-1.5 transition-colors border-l border-border ${
                      connectApex ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                    }`}
                  >
                    Apex ({props.apexHost})
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {connectApex
                    ? `Creates sc-domain:${props.apexHost} — covers every subdomain in one go.`
                    : `Creates sc-domain:${props.targetHost} — only this subdomain.`}
                </p>
              </div>
            )}

            <a
              href={`/api/integrations/gsc/connect?host=${encodeURIComponent(connectHost)}`}
              className="inline-block bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Connect Google Search Console
            </a>
          </div>
        )}
      </div>

      {/* ── Verification panel ──────────────────────────── */}
      {props.connected && !props.verified && (
        <VerificationPanel
          method={method}
          setMethod={setMethod}
          verification={props.verification}
          targetHost={props.targetHost}
          apexHost={props.apexHost}
          verifyApex={verifyApex}
          setVerifyApex={setVerifyApex}
          verifyHost={verifyHost}
          siteUrl={props.siteUrl}
          readOnly={props.readOnly}
          busy={busy}
          onFetchToken={handleFetchToken}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}

// ── Setup checklist ─────────────────────────────────────────

function SetupChecklist({
  open,
  onToggle,
  gcpClientConfigured,
  connected,
  verified,
  redirectUri,
  done,
}: {
  open: boolean;
  onToggle: () => void;
  gcpClientConfigured: boolean;
  connected: boolean;
  verified: boolean;
  redirectUri: string;
  done: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold">Google Cloud setup checklist</span>
          <span className="text-xs text-muted-foreground">
            ({done}/4 done)
          </span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 text-sm">
          <ChecklistItem
            done={true}
            title="1. Create an OAuth 2.0 Client (Web application)"
          >
            <p className="text-xs text-muted-foreground">
              In Google Cloud Console →{' '}
              <Link
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                className="underline"
              >
                APIs &amp; Services → Credentials
              </Link>
              , create an OAuth client of type <em>Web application</em>. Add this redirect URI:
            </p>
            <CopyLine value={redirectUri} />
          </ChecklistItem>

          <ChecklistItem
            done={gcpClientConfigured}
            title="2. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET"
          >
            <p className="text-xs text-muted-foreground">
              {gcpClientConfigured ? (
                <>Both env vars are present in this deployment.</>
              ) : (
                <>
                  Copy the Client ID and Client Secret into your secrets store
                  (Infisical / Dokploy env vars). Re-deploy and they&apos;ll
                  show as set here.
                </>
              )}
            </p>
          </ChecklistItem>

          <ChecklistItem
            done={true}
            title="3. Enable required Google APIs"
          >
            <p className="text-xs text-muted-foreground">
              These three APIs must be enabled on the Google Cloud project
              backing the OAuth client. Click each link to enable it:
            </p>
            <ul className="space-y-1 text-xs">
              {REQUIRED_APIS.map((api) => (
                <li key={api.apiId} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span className="flex-1">
                    <a
                      href={`https://console.cloud.google.com/apis/library/${api.apiId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      {api.name}
                    </a>
                    <span className="text-muted-foreground"> — {api.why}</span>
                  </span>
                </li>
              ))}
            </ul>
          </ChecklistItem>

          <ChecklistItem
            done={true}
            title="4. Add OAuth scopes on the consent screen"
          >
            <p className="text-xs text-muted-foreground">
              In Google Cloud Console →{' '}
              <Link
                href="https://console.cloud.google.com/apis/credentials/consent"
                target="_blank"
                className="underline"
              >
                APIs &amp; Services → OAuth consent screen → Data access
              </Link>
              , add these three scopes:
            </p>
            <div className="space-y-1">
              {REQUIRED_SCOPES.map((s) => (
                <CopyLine key={s} value={s} />
              ))}
            </div>
          </ChecklistItem>

          <ChecklistItem
            done={connected}
            title="5. Connect Search Console (this app)"
          >
            <p className="text-xs text-muted-foreground">
              {connected
                ? 'Connected to Search Console.'
                : 'Click "Connect Google Search Console" below — we OAuth, find or auto-create the GSC property for your domain, and walk you through verification.'}
            </p>
          </ChecklistItem>

          <ChecklistItem
            done={verified}
            title="6. Verify ownership"
          >
            <p className="text-xs text-muted-foreground">
              {verified
                ? 'Property is verified — indexing API calls will succeed.'
                : 'Pick a method (Meta tag, HTML file, DNS TXT) in the Verify ownership panel below. We auto-fetch the token from Google.'}
            </p>
          </ChecklistItem>
        </div>
      )}
    </div>
  );
}

function ChecklistItem({
  done,
  title,
  children,
}: {
  done: boolean;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className={`text-sm font-medium ${done ? 'text-foreground' : 'text-foreground'}`}>
          {title}
        </span>
      </div>
      <div className="pl-6 space-y-1.5">{children}</div>
    </div>
  );
}

function CopyLine({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
      <code className="text-xs font-mono break-all flex-1">{value}</code>
      <button
        type="button"
        onClick={onCopy}
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <Copy className="h-3 w-3" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ── Verification panel ──────────────────────────────────────

function VerificationPanel({
  method,
  setMethod,
  verification,
  targetHost,
  apexHost,
  verifyApex,
  setVerifyApex,
  verifyHost,
  siteUrl,
  readOnly,
  busy,
  onFetchToken,
  onVerify,
}: {
  method: Method;
  setMethod: (m: Method) => void;
  verification: Verification;
  targetHost: string;
  apexHost: string;
  verifyApex: boolean;
  setVerifyApex: (v: boolean) => void;
  verifyHost: string;
  siteUrl: string | null;
  readOnly: boolean;
  busy: 'disconnect' | 'switch' | 'fetch' | 'verify' | null;
  onFetchToken: (m: Method, host?: string) => void;
  onVerify: () => void;
}) {
  const hasSubdomain = targetHost !== apexHost;
  const tokenMatchesTarget = verification.host === verifyHost;
  const haveToken =
    tokenMatchesTarget &&
    ((method === 'META' && verification.metaToken) ||
      (method === 'FILE' && verification.fileName) ||
      (method === 'DNS_TXT' && verification.dnsRecord));
  const subdomainLabel =
    hasSubdomain && !verifyApex
      ? targetHost.replace(new RegExp(`\\.${apexHost.replace(/\./g, '\\.')}$`), '')
      : '';

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3 text-sm">
      <div>
        <h2 className="text-sm font-semibold">Verify ownership</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Google needs proof you own <code className="font-mono">{verifyHost}</code>.
        </p>
      </div>

      {hasSubdomain && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Verify against
          </div>
          <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setVerifyApex(true)}
              className={`px-3 py-1.5 transition-colors ${
                verifyApex ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
              }`}
            >
              Apex ({apexHost})
            </button>
            <button
              type="button"
              onClick={() => setVerifyApex(false)}
              className={`px-3 py-1.5 transition-colors border-l border-border ${
                !verifyApex ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
              }`}
            >
              Subdomain ({targetHost})
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(['META', 'FILE', 'DNS_TXT'] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              method === m
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-accent'
            }`}
          >
            {m === 'DNS_TXT' ? 'DNS TXT' : m === 'META' ? 'Meta tag' : 'HTML file'}
          </button>
        ))}
      </div>

      {!haveToken ? (
        <div>
          <button
            type="button"
            onClick={() => onFetchToken(method)}
            disabled={readOnly || busy !== null}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {busy === 'fetch' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Get verification token
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {method === 'META' && verification.metaToken && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Auto-injected into <code>&lt;head&gt;</code>. Visible after redeploy + 60s cache:
              </p>
              <CopyLine
                value={`<meta name="google-site-verification" content="${verification.metaToken}" />`}
              />
            </div>
          )}

          {method === 'FILE' && verification.fileName && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Auto-served via proxy rewrite. After redeploy:
              </p>
              <CopyLine value={`https://${targetHost}/${verification.fileName}`} />
            </div>
          )}

          {method === 'DNS_TXT' && verification.dnsRecord && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Add a TXT record on{' '}
                {verifyApex ? (
                  <>
                    <code>{apexHost}</code> (Host: <code>@</code>):
                  </>
                ) : (
                  <>
                    <code>{verifyHost}</code> (Host: <code>{subdomainLabel || '@'}</code> in the{' '}
                    <code>{apexHost}</code> zone):
                  </>
                )}
              </p>
              <CopyLine value={verification.dnsRecord} />
              <p className="text-xs text-muted-foreground">
                Wait for <code>dig TXT {verifyHost}</code> to show the record before clicking Verify.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onVerify}
              disabled={readOnly || busy !== null}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {busy === 'verify' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Verify ownership
            </button>
            <button
              type="button"
              onClick={() => onFetchToken(method)}
              disabled={readOnly || busy !== null}
              className="border border-border px-3 py-1.5 rounded-md text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy === 'fetch' ? 'Refreshing…' : 'Refresh token'}
            </button>
            <a
              href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(siteUrl ?? '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md text-xs font-medium hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open in Search Console
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono break-all' : ''} ${className ?? ''}`}>
        {value}
      </div>
    </div>
  );
}

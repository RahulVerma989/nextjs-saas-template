'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';

type Method = 'META' | 'FILE' | 'DNS_TXT';

interface SiteOption {
  siteUrl: string;
  permissionLevel: string;
  verified: boolean;
}

interface Verification {
  method: Method | null;
  metaToken: string | null;
  fileName: string | null;
  fileContent: string | null;
  dnsRecord: string | null;
}

interface Props {
  connected: boolean;
  siteUrl: string | null;
  targetHost: string;
  connectedAt: string | null;
  lastUsedAt: string | null;
  lastError: string | null;
  verified: boolean;
  verification: Verification;
  readOnly: boolean;
}

export function GSCSettingsClient(props: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState<'disconnect' | 'switch' | 'fetch' | 'verify' | null>(null);
  const [sites, setSites] = useState<SiteOption[] | null>(null);
  const [sitesLoaded, setSitesLoaded] = useState(false);
  const [method, setMethod] = useState<Method>(props.verification.method ?? 'META');

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
    if (
      !confirm(
        'Disconnect Search Console? Submitted pages will stop receiving updates until you reconnect.',
      )
    )
      return;
    setBusy('disconnect');
    try {
      const res = await fetch('/api/integrations/gsc', { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      } else {
        setBanner({ kind: 'error', text: 'Failed to disconnect.' });
      }
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

  const handleFetchToken = async (m: Method) => {
    setBusy('fetch');
    setBanner(null);
    try {
      const res = await fetch(`/api/integrations/gsc/verify?method=${m}`);
      const data = await res.json();
      if (data.success) {
        setMethod(m);
        setBanner({ kind: 'info', text: `Fetched a fresh ${m} token. Place it on your site, then click "Verify ownership".` });
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

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Search Engine Optimization</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Connect Google Search Console so this deployment can auto-submit
        marketing pages to Google&apos;s Indexing API. Per-page status lives
        on the{' '}
        <Link href="/dashboard/admin/page-indexing" className="underline">
          Page Indexing
        </Link>{' '}
        admin page.
      </p>

      {banner && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
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

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Google Search Console</h2>

        <div className="mb-4 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Auto-matching against host{' '}
          <code className="font-mono text-foreground">{props.targetHost}</code>
          . On connect we look for an existing verified property; if there
          isn&apos;t one we add{' '}
          <code className="font-mono">sc-domain:{props.targetHost.replace(/^www\./, '')}</code>{' '}
          to your account and walk you through verification.
        </div>

        {props.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Property" value={props.siteUrl ?? '—'} mono />
              <Field
                label="Status"
                value={props.verified ? 'Verified' : 'Awaiting verification'}
                tone={props.verified ? 'positive' : 'warning'}
                icon={
                  props.verified ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )
                }
              />
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
                  className="mt-1 w-full sm:w-96 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifiedSites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl}>
                      {s.siteUrl}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick a different verified property if the auto-match got it wrong.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href="/api/integrations/gsc/connect"
                className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                Reconnect
              </a>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={props.readOnly || busy !== null}
                className="text-destructive border border-destructive/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in with the Google account that should manage this
              deployment&apos;s SEO. We&apos;ll request the{' '}
              <code>webmasters</code>, <code>indexing</code>, and{' '}
              <code>siteverification</code> scopes so we can add and verify the
              property on your behalf.
            </p>
            <a
              href="/api/integrations/gsc/connect"
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Connect Google Search Console
            </a>
          </div>
        )}
      </div>

      {/* Verification panel — only shown when connected but not yet verified */}
      {props.connected && !props.verified && (
        <VerificationPanel
          method={method}
          setMethod={setMethod}
          verification={props.verification}
          targetHost={props.targetHost}
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

function VerificationPanel({
  method,
  setMethod,
  verification,
  targetHost,
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
  siteUrl: string | null;
  readOnly: boolean;
  busy: 'disconnect' | 'switch' | 'fetch' | 'verify' | null;
  onFetchToken: (m: Method) => void;
  onVerify: () => void;
}) {
  const apex = targetHost.replace(/^www\./, '');
  const haveToken =
    (method === 'META' && verification.metaToken) ||
    (method === 'FILE' && verification.fileName) ||
    (method === 'DNS_TXT' && verification.dnsRecord);

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6">
      <h2 className="text-lg font-semibold mb-2">Verify ownership</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Google needs proof that you own{' '}
        <code className="font-mono">{siteUrl ?? targetHost}</code> before it
        accepts indexing requests. Pick a method, place the token, then hit{' '}
        <em>Verify ownership</em> — we&apos;ll ask Google to check.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['META', 'FILE', 'DNS_TXT'] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
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
        <div className="space-y-3">
          <p className="text-sm">
            Click below to fetch a fresh token for the{' '}
            <strong>{method === 'DNS_TXT' ? 'DNS TXT' : method === 'META' ? 'Meta tag' : 'HTML file'}</strong>{' '}
            method.
          </p>
          <button
            type="button"
            onClick={() => onFetchToken(method)}
            disabled={readOnly || busy !== null}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {busy === 'fetch' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Get verification token
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {method === 'META' && verification.metaToken && (
            <Instructions
              steps={[
                <>
                  This template auto-injects the meta tag into the homepage{' '}
                  <code>&lt;head&gt;</code> for you. Once you&apos;ve redeployed
                  (or after up to 60s of cache), the tag will be live.
                </>,
                <>
                  Confirm by viewing source on{' '}
                  <a
                    className="underline"
                    href={`https://${targetHost}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://{targetHost}/
                  </a>{' '}
                  — you should see:
                </>,
              ]}
            >
              <CodeBlock
                value={`<meta name="google-site-verification" content="${verification.metaToken}" />`}
              />
            </Instructions>
          )}

          {method === 'FILE' && verification.fileName && (
            <Instructions
              steps={[
                <>
                  This template serves the verification file automatically at{' '}
                  <code>/{verification.fileName}</code> via a proxy rewrite.
                  After redeploying it will be reachable at:
                </>,
              ]}
            >
              <CodeBlock value={`https://${targetHost}/${verification.fileName}`} link />
              <p className="text-xs text-muted-foreground">
                File contents (already wired into the route handler):
              </p>
              <CodeBlock value={verification.fileContent ?? ''} />
            </Instructions>
          )}

          {method === 'DNS_TXT' && verification.dnsRecord && (
            <Instructions
              steps={[
                <>
                  Add a TXT record to the DNS zone for{' '}
                  <code>{apex}</code>:
                </>,
              ]}
            >
              <div className="rounded-md border border-border bg-background p-3 text-xs font-mono space-y-1">
                <div>
                  <span className="text-muted-foreground">Type: </span>TXT
                </div>
                <div>
                  <span className="text-muted-foreground">Host: </span>@ (root)
                </div>
                <div className="break-all">
                  <span className="text-muted-foreground">Value: </span>
                  {verification.dnsRecord}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                DNS propagation can take a few minutes — wait until{' '}
                <code>dig TXT {apex}</code> shows the record before clicking
                Verify.
              </p>
            </Instructions>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onVerify}
              disabled={readOnly || busy !== null}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {busy === 'verify' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify ownership
            </button>
            <button
              type="button"
              onClick={() => onFetchToken(method)}
              disabled={readOnly || busy !== null}
              className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy === 'fetch' ? 'Refreshing…' : 'Refresh token'}
            </button>
            <a
              href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(siteUrl ?? '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Search Console
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Instructions({
  steps,
  children,
}: {
  steps: React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 text-sm">
      <ol className="list-decimal pl-5 space-y-1 text-foreground">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CodeBlock({ value, link }: { value: string; link?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background p-3">
      <code className="text-xs font-mono break-all flex-1">
        {link ? (
          <a className="underline" href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        title="Copy"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  className,
  tone,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
  tone?: 'positive' | 'warning';
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : tone === 'warning'
        ? 'text-yellow-700 dark:text-yellow-400'
        : '';
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-sm inline-flex items-center gap-1.5 ${mono ? 'font-mono break-all' : ''} ${toneClass} ${className ?? ''}`}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}

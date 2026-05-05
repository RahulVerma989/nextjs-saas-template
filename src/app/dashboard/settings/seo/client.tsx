'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';

interface Stats {
  submitted: number;
  indexed: number;
  notIndexed: number;
  errored: number;
  total: number;
}

interface PageRow {
  path: string;
  status: string;
  coverageState: string | null;
  submittedAt: string | null;
  inspectedAt: string | null;
  lastError: string | null;
}

interface SiteOption {
  siteUrl: string;
  permissionLevel: string;
  verified: boolean;
}

interface Props {
  connected: boolean;
  siteUrl: string | null;
  /** Host derived from siteConfig.url — what the auto-match looks for. */
  targetHost: string;
  connectedAt: string | null;
  lastUsedAt: string | null;
  lastError: string | null;
  stats: Stats;
  pages: PageRow[];
  /** Demo mode disables all writes (sync, switch, disconnect). */
  readOnly: boolean;
}

export function GSCSettingsClient(props: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<'disconnect' | 'sync' | 'switch' | null>(null);
  const [sites, setSites] = useState<SiteOption[] | null>(null);
  const [sitesLoaded, setSitesLoaded] = useState(false);

  useEffect(() => {
    const status = search.get('gsc');
    if (!status) return;
    if (status === 'connected') {
      setBanner({ kind: 'success', text: 'Search Console connected successfully.' });
    } else if (status.startsWith('error:')) {
      const reason = decodeURIComponent(status.slice('error:'.length));
      setBanner({ kind: 'error', text: `Couldn't connect: ${reason}` });
    }
  }, [search]);

  // Lazy-load the property list when connected so the switcher dropdown
  // shows up.  Skip in demo mode — the picker is read-only there anyway.
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
    ) {
      return;
    }
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

  const handleSync = async () => {
    setBusy('sync');
    setBanner(null);
    try {
      const res = await fetch('/api/integrations/gsc/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const r = data.data;
        const note =
          r.skipped
            ? `Sync skipped — ${r.skipped}.`
            : `Sync done — submitted ${r.submitted}, inspected ${r.inspected}, errors ${r.errors}.`;
        setBanner({ kind: 'success', text: note });
        router.refresh();
      } else {
        setBanner({ kind: 'error', text: data.error ?? 'Sync failed' });
      }
    } catch {
      setBanner({ kind: 'error', text: 'Sync failed (network error)' });
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

  const verifiedSites = (sites ?? []).filter((s) => s.verified);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Search Engine Optimization</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Connect Google Search Console so the background worker can auto-submit
        changed marketing pages to Google&apos;s Indexing API. New and updated
        pages get picked up by Google within hours instead of days, and you
        don&apos;t have to do anything.
      </p>

      {banner && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Google Search Console</h2>

        <div className="mb-4 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Auto-matching against host{' '}
          <code className="font-mono text-foreground">{props.targetHost}</code>
          . The match prefers a verified <code>sc-domain:</code> property
          (covering all subdomains), then walks up to its apex, then URL-prefix
          variants.
        </div>

        {props.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

            {/* Property switcher */}
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
                  Pick a different verified property if the auto-match got it
                  wrong.
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">Indexing status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <Stat label="Tracked" value={props.stats.total} />
                <Stat label="Submitted" value={props.stats.submitted} />
                <Stat label="Indexed" value={props.stats.indexed} tone="positive" />
                <Stat label="Not indexed" value={props.stats.notIndexed} tone="muted" />
                <Stat label="Errored" value={props.stats.errored} tone="negative" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Counts come from the page-indexing job, which runs every 30 minutes
                and on every deploy. Routes are pulled from <code>src/config/indexable-routes.ts</code>.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleSync}
                disabled={props.readOnly || busy !== null}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {busy === 'sync' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Run sync now
              </button>
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
              Sign in with the Google account that owns your Search Console property
              and grant the <code>webmasters</code> + <code>indexing</code> scopes.
              We&apos;ll auto-pick the verified property that matches{' '}
              <code className="font-mono">{props.targetHost}</code>.
            </p>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                Setup checklist
              </summary>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>
                  Verify <code>{props.targetHost}</code> (or its apex domain) at{' '}
                  <a
                    className="text-primary underline"
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noreferrer"
                  >
                    search.google.com/search-console
                  </a>
                  . A <code>sc-domain</code> property covers all subdomains.
                </li>
                <li>
                  In Google Cloud Console, enable the{' '}
                  <em>Search Console API</em> and the{' '}
                  <em>Web Search Indexing API</em>.
                </li>
                <li>
                  On your OAuth consent screen, add the scopes
                  <code> https://www.googleapis.com/auth/webmasters </code>
                  and
                  <code> https://www.googleapis.com/auth/indexing</code>.
                </li>
                <li>
                  Add the redirect URI{' '}
                  <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/integrations/gsc/callback` : '/api/integrations/gsc/callback'}</code>
                  .
                </li>
              </ol>
            </details>

            <a
              href="/api/integrations/gsc/connect"
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Connect Google Search Console
            </a>
          </div>
        )}
      </div>

      {/* Per-page indexing table */}
      {props.connected && props.pages.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Per-page status</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {props.pages.length} tracked routes — newest activity first.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Path</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Coverage</th>
                  <th className="px-4 py-2 font-medium">Submitted</th>
                  <th className="px-4 py-2 font-medium">Inspected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {props.pages.map((p) => (
                  <tr key={p.path} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{p.path}</td>
                    <td className="px-4 py-2 text-xs">
                      <StatusPill status={p.status} />
                      {p.lastError && (
                        <div className="text-[11px] text-destructive mt-1 max-w-xs truncate" title={p.lastError}>
                          {p.lastError}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {p.coverageState ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {p.submittedAt ? new Date(p.submittedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {p.inspectedAt ? new Date(p.inspectedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-sm ${mono ? 'font-mono break-all' : ''} ${className ?? ''}`}
      >
        {value}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'positive' | 'negative' | 'muted';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : tone === 'negative'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    indexed: 'bg-green-500/10 text-green-700 dark:text-green-400',
    submitted: 'bg-primary/10 text-primary',
    not_indexed: 'bg-muted text-muted-foreground',
    error: 'bg-destructive/10 text-destructive',
    pending: 'bg-warning/10 text-warning',
  };
  const cls = map[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

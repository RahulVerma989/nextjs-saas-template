'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Stats {
  submitted: number;
  indexed: number;
  notIndexed: number;
  errored: number;
  total: number;
}

interface Props {
  connected: boolean;
  siteUrl: string | null;
  connectedAt: string | null;
  lastUsedAt: string | null;
  lastError: string | null;
  stats: Stats;
}

export function GSCSettingsClient(props: Props) {
  const search = useSearchParams();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

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

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Search Console? Submitted pages will stop receiving updates until you reconnect.')) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/gsc', { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      } else {
        setBanner({ kind: 'error', text: 'Failed to disconnect.' });
      }
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-3xl">
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

            <div className="flex gap-2 pt-2">
              <a
                href="/api/integrations/gsc/connect"
                className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                Reconnect
              </a>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive border border-destructive/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in with the Google account that owns your Search Console property
              and grant the <code>webmasters</code> + <code>indexing</code> scopes.
              We&apos;ll auto-pick the first verified property — reconnect later to
              switch.
            </p>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                Setup checklist
              </summary>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>
                  Verify your site at{' '}
                  <a
                    className="text-primary underline"
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noreferrer"
                  >
                    search.google.com/search-console
                  </a>
                  .
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

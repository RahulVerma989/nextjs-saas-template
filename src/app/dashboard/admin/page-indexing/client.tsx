'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';

interface Stats {
  submitted: number;
  indexed: number;
  notIndexed: number;
  errored: number;
  pending: number;
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

interface Props {
  connected: boolean;
  verified: boolean;
  siteUrl: string | null;
  stats: Stats;
  pages: PageRow[];
  readOnly: boolean;
}

export function PageIndexingClient(props: Props) {
  const router = useRouter();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSync = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/integrations/gsc/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const r = data.data;
        setBanner({
          kind: 'success',
          text: r.skipped
            ? `Sync skipped — ${r.skipped}.`
            : `Sync done — submitted ${r.submitted}, inspected ${r.inspected}, errors ${r.errors}.`,
        });
        router.refresh();
      } else {
        setBanner({ kind: 'error', text: data.error ?? 'Sync failed' });
      }
    } catch {
      setBanner({ kind: 'error', text: 'Sync failed (network error)' });
    } finally {
      setBusy(false);
    }
  };

  if (!props.connected) {
    return (
      <div className="max-w-5xl space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Page indexing</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Connect Google Search Console first to start tracking marketing pages.
          </p>
        </div>
        <Link
          href="/dashboard/settings/seo"
          className="inline-block bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
        >
          Go to SEO settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Page indexing</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Auto-syncs <strong>every 30 min via Agenda</strong> + once per
          deploy (boot hook). Routes from{' '}
          <code className="text-[11px]">src/config/indexable-routes.ts</code>;
          content hashes from <code className="text-[11px]">scripts/build-page-manifest.ts</code>.
        </p>
      </div>

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

      {!props.verified && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
          The connected property{' '}
          <code className="font-mono">{props.siteUrl}</code> is not yet verified
          in Google Search Console. Indexing API calls will fail until you{' '}
          <Link href="/dashboard/settings/seo" className="underline font-medium">
            verify ownership
          </Link>
          .
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center mb-6">
        <Stat label="Tracked" value={props.stats.total} />
        <Stat label="Pending" value={props.stats.pending} />
        <Stat label="Submitted" value={props.stats.submitted} />
        <Stat label="Indexed" value={props.stats.indexed} tone="positive" />
        <Stat label="Not indexed" value={props.stats.notIndexed} tone="muted" />
        <Stat label="Errored" value={props.stats.errored} tone="negative" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={handleSync}
          disabled={props.readOnly || busy || !props.verified}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Run sync now
        </button>
      </div>

      {props.pages.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No routes tracked yet. The first sync will populate this table.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                        <div
                          className="text-[11px] text-destructive mt-1 max-w-xs truncate"
                          title={p.lastError}
                        >
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
    pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  };
  const cls = map[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

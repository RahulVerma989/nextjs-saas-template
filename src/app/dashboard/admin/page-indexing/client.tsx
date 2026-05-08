'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, RefreshCw } from 'lucide-react';
import { DemoButton } from '@/components/ui/demo-button';

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

type SortKey = 'path' | 'status' | 'coverage' | 'submitted' | 'inspected';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<string, string> = {
  indexed: 'Indexed',
  submitted: 'Submitted',
  not_indexed: 'Not indexed',
  error: 'Error',
  pending: 'Pending',
};

const STATUS_PILL_CLASSES: Record<string, string> = {
  indexed:
    'bg-green-500/10 text-green-700 ring-1 ring-green-500/30 dark:text-green-400',
  submitted:
    'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/30 dark:text-blue-400',
  not_indexed:
    'bg-muted text-muted-foreground ring-1 ring-border',
  error:
    'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
  pending:
    'bg-yellow-500/10 text-yellow-700 ring-1 ring-yellow-500/30 dark:text-yellow-400',
};

export function PageIndexingClient(props: Props) {
  const router = useRouter();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('inspected');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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

  const sortedPages = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const get = (p: PageRow): string | number => {
      switch (sortKey) {
        case 'path':
          return p.path;
        case 'status':
          return p.status;
        case 'coverage':
          return p.coverageState ?? '';
        case 'submitted':
          return p.submittedAt ? new Date(p.submittedAt).getTime() : 0;
        case 'inspected':
          return p.inspectedAt ? new Date(p.inspectedAt).getTime() : 0;
      }
    };
    return [...props.pages].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [props.pages, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Default direction per column type — strings ascending, dates descending.
      setSortDir(key === 'path' || key === 'status' || key === 'coverage' ? 'asc' : 'desc');
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
          className="inline-block bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
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
          className={`rounded-md border px-3 py-2 text-sm ${
            banner.kind === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {banner.text}
        </div>
      )}

      {!props.verified && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
          The connected property{' '}
          <code className="font-mono">{props.siteUrl}</code> is not yet verified
          in Google Search Console. Indexing API calls will fail until you{' '}
          <Link href="/dashboard/settings/seo" className="underline font-medium">
            verify ownership
          </Link>
          .
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
        <Stat label="Tracked" value={props.stats.total} />
        <Stat label="Pending" value={props.stats.pending} />
        <Stat label="Submitted" value={props.stats.submitted} />
        <Stat label="Indexed" value={props.stats.indexed} tone="positive" />
        <Stat label="Not indexed" value={props.stats.notIndexed} tone="muted" />
        <Stat label="Errored" value={props.stats.errored} tone="negative" />
      </div>

      <div className="flex flex-wrap gap-2">
        <DemoButton
          readOnly={props.readOnly}
          disabled={busy || !props.verified}
          tooltipEnabled={
            props.verified
              ? 'Trigger the sync immediately instead of waiting for the next 30-min tick'
              : 'Verify ownership before running sync — Google rejects unverified properties'
          }
          onClick={handleSync}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Run sync now
        </DemoButton>
      </div>

      {props.pages.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No routes tracked yet. The first sync will populate this table.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Per-page status</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {props.pages.length} tracked routes — click a column to sort.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <SortHeader label="Path" k="path" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Coverage" k="coverage" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Submitted" k="submitted" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Inspected" k="inspected" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedPages.map((p) => (
                  <tr key={p.path} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{p.path}</td>
                    <td className="px-4 py-2 text-xs">
                      <StatusPill status={p.status} />
                      {/* lastError is only meaningful while the row is
                          still in the error state. Once we successfully
                          re-submit / inspect, the service clears it,
                          but stale rows still in flight may carry it. */}
                      {p.status === 'error' && p.lastError && (
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
  const cls =
    STATUS_PILL_CLASSES[status] ??
    'bg-muted text-muted-foreground ring-1 ring-border';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="px-4 py-2 font-medium select-none">
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

/**
 * Page Indexing Service
 *
 * Reads the build-time page-manifest.json (every indexable marketing
 * route + its content hash) and reconciles it with Google Search
 * Console:
 *   - new / changed routes  → submit URL_UPDATED to the Indexing API
 *   - removed routes        → submit URL_DELETED + delete the doc
 *   - submitted routes      → re-inspect periodically until indexed
 *
 * Distributed-locked on the manifest's buildId so multiple replicas
 * only do one round of submissions per deploy.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { connectDB } from '@/lib/db/connection';
import { PageIndex } from '@/lib/db/models';
import { siteConfig } from '@/config/site.config';
import { getDistributedLock } from '@/lib/jobs/utils/distributed-lock';
import * as gsc from './gsc.service';

interface ManifestEntry {
  path: string;
  group: string;
  contentHash: string;
  sourceFiles: string[];
}

interface Manifest {
  buildId: string;
  generatedAt: string;
  routes: ManifestEntry[];
}

const MANIFEST_PATH = resolve(process.cwd(), 'src/lib/data/page-manifest.json');

// Settle delay so the deploy is fully live before we ping Google.
// Override with PAGE_INDEXING_SETTLE_MS for staging tests.
const SETTLE_DELAY_MS = Number(process.env.PAGE_INDEXING_SETTLE_MS ?? 60_000);

// How many submit/inspect calls to make per run.  Google's free
// Indexing API quota is ~200/day per project, so cap aggressively.
const SUBMIT_BUDGET_PER_RUN = 25;
const INSPECT_BUDGET_PER_RUN = 25;

export interface PageSyncResult {
  submitted: number;
  inspected: number;
  errors: number;
  /** URLs we skipped this run because the live page wasn't reachable. */
  skippedUnreachable: number;
  quotaHit: boolean;
  notes: string[];
  skipped?: string;
}

function loadManifest(): Manifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  } catch (err) {
    console.error('[PageIndexing] Failed to parse manifest:', err);
    return null;
  }
}

/**
 * Schedule the boot-time sync.  Called from instrumentation.ts so
 * every container waits SETTLE_DELAY_MS after start, then reconciles
 * once.  Subsequent recurring runs come from the agenda job.
 */
export function scheduleSyncOnBoot(): void {
  if (!siteConfig.features.gscIndexing) return;
  setTimeout(async () => {
    try {
      const r = await runPageSync();
      if (!r.skipped) {
        console.log(
          `[PageIndexing] boot run — submitted=${r.submitted} inspected=${r.inspected} errors=${r.errors}`,
        );
      } else {
        console.log(`[PageIndexing] boot run skipped — ${r.skipped}`);
      }
    } catch (err) {
      console.error('[PageIndexing] boot run failed:', err);
    }
  }, SETTLE_DELAY_MS).unref();
}

/**
 * Reconcile the manifest with PageIndex docs and call GSC for
 * everything that needs it.  Returns counters for logging.
 */
export async function runPageSync(): Promise<PageSyncResult> {
  const result: PageSyncResult = {
    submitted: 0,
    inspected: 0,
    errors: 0,
    skippedUnreachable: 0,
    quotaHit: false,
    notes: [],
  };

  const manifest = loadManifest();
  if (!manifest || manifest.routes.length === 0) {
    return { ...result, skipped: 'no manifest' };
  }

  const conn = await gsc.getConnection();
  if (!conn) return { ...result, skipped: 'GSC not connected' };

  const lock = getDistributedLock();
  // Per-build lock (buildId is stable across replicas of the same deploy)
  // → only one replica runs per deploy.  Per-run lock prevents two cron
  // ticks overlapping.
  const acquired = await lock.acquire(`page-indexing:${manifest.buildId}`, {
    ttlMs: 10 * 60 * 1000,
    retryCount: 0,
  });
  if (!acquired) return { ...result, skipped: 'another replica holds the lock' };

  try {
    await connectDB();

    const baseUrl = siteConfig.url.replace(/\/$/, '');
    const manifestPaths = new Set(manifest.routes.map((r) => r.path));
    const existingDocs = await PageIndex.find().lean();
    const existingByPath = new Map(existingDocs.map((d) => [d._id, d]));

    // 1. URL_DELETED for routes that disappeared from the manifest
    for (const doc of existingDocs) {
      if (manifestPaths.has(doc._id)) continue;
      try {
        await gsc.submitUrlDeleted(`${baseUrl}${doc._id}`);
        await PageIndex.deleteOne({ _id: doc._id });
        result.submitted += 1;
        result.notes.push(`deleted ${doc._id}`);
      } catch (err) {
        result.errors += 1;
        if (isQuotaError(err)) {
          result.quotaHit = true;
          break;
        }
        console.warn('[PageIndexing] delete failed for', doc._id, err);
      }
    }

    // 2. URL_UPDATED for new / changed routes (budget-capped)
    let submitBudget = SUBMIT_BUDGET_PER_RUN;
    for (const route of manifest.routes) {
      if (submitBudget <= 0 || result.quotaHit) break;
      const existing = existingByPath.get(route.path);
      const isChanged = !existing || existing.contentHash !== route.contentHash;
      if (!isChanged) continue;

      const fullUrl = `${baseUrl}${route.path}`;
      // Skip if the page isn't reachable yet — protects against the
      // Dokploy "boot fired before traffic switched" race so we never
      // hand Google a 404.
      const live = await isLive(fullUrl);
      if (!live) {
        result.skippedUnreachable += 1;
        continue;
      }

      try {
        const ts = await gsc.submitUrlUpdated(fullUrl);
        await PageIndex.findByIdAndUpdate(
          route.path,
          {
            _id: route.path,
            contentHash: route.contentHash,
            status: 'submitted',
            submittedAt: ts,
            lastError: undefined,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        result.submitted += 1;
        submitBudget -= 1;
      } catch (err) {
        result.errors += 1;
        await PageIndex.findByIdAndUpdate(
          route.path,
          {
            _id: route.path,
            contentHash: existing?.contentHash ?? route.contentHash,
            status: 'error',
            lastError: err instanceof Error ? err.message : String(err),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        if (isQuotaError(err)) {
          result.quotaHit = true;
          break;
        }
      }
    }

    // 3. Re-inspect submitted-but-not-yet-indexed routes
    if (!result.quotaHit) {
      const pending = await PageIndex.find({ status: 'submitted' })
        .sort({ inspectedAt: 1 })
        .limit(INSPECT_BUDGET_PER_RUN)
        .lean();

      for (const doc of pending) {
        if (result.quotaHit) break;
        try {
          const r = await gsc.inspectUrl(`${baseUrl}${doc._id}`);
          await PageIndex.updateOne(
            { _id: doc._id },
            {
              status: r.indexed ? 'indexed' : 'not_indexed',
              coverageState: r.coverageState,
              inspectedAt: new Date(),
            },
          );
          result.inspected += 1;
        } catch (err) {
          result.errors += 1;
          if (isQuotaError(err)) {
            result.quotaHit = true;
            break;
          }
        }
      }
    }
  } finally {
    await lock.release(`page-indexing:${manifest.buildId}`);
  }

  return result;
}

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: number | string; message?: string };
  if (e.code === 429 || e.code === '429') return true;
  return /quota|rate.?limit/i.test(e.message ?? '');
}

/**
 * HEAD-check the live URL to verify it's reachable before pinging
 * Google.  On Dokploy / Vercel / Cloudflare deploys, the boot hook
 * can fire before the new build is actually serving traffic, and a
 * URL_UPDATED submission for an unreachable URL gets recorded by
 * Google as a 404.  Mirrors the safety check Quillly's
 * page-indexing.service uses.
 */
async function isLive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'GSC-PageIndexer/1.0' },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

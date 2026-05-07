/**
 * Page Indexing Sync Job
 *
 * Recurring Agenda job that handles the submit-then-inspect lifecycle
 * for marketing pages.  Compares the build-time page-manifest.json
 * against the stored hash for each route, submits URL_UPDATED to
 * Google's Indexing API for changed/new routes, and re-checks the
 * indexed status of pending ones.
 *
 * Runs every 30 minutes.  Single GSC connection → single rate-limit
 * lane, so concurrency is forced to 1.
 */
import { Agenda } from 'agenda';
import { connectDB } from '@/lib/db/connection';

export function definePageIndexingSyncJob(agenda: Agenda): void {
  agenda.define(
    'page-indexing-sync',
    async () => {
      const startedAt = Date.now();
      console.log('[PageIndexingSync] Starting run…');

      try {
        await connectDB();
        const { runPageSync } = await import('@/lib/services/page-indexing.service');
        const r = await runPageSync();

        const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
        if (r.skipped) {
          console.log(`[PageIndexingSync] skipped — ${r.skipped} (${elapsedSec}s)`);
          return;
        }
        console.log(
          `[PageIndexingSync] done — submitted=${r.submitted} inspected=${r.inspected} errors=${r.errors}` +
            (r.quotaHit ? ' (quota hit)' : '') +
            ` in ${elapsedSec}s` +
            (r.notes.length ? ` notes=[${r.notes.join('; ')}]` : ''),
        );
      } catch (err) {
        console.error('[PageIndexingSync] run failed:', err);
        throw err;
      }
    },
    { concurrency: 1, lockLifetime: 12 * 60 * 1000 },
  );
}

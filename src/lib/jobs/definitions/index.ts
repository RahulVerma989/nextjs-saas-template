/**
 * Job Definitions Registry
 *
 * Central registry for all Agenda jobs in the system.  Jobs are
 * defined (registered) here on worker startup, then scheduled
 * (cron-style) by scheduleRecurringJobs().
 *
 * Add your own job files in this directory and import them here.
 */

import { Agenda } from 'agenda';
import { siteConfig } from '@/config/site.config';
import { definePageIndexingSyncJob } from './page-indexing-sync.job';

export type JobName = 'example-cleanup' | 'page-indexing-sync';

/**
 * Register all job definitions with Agenda.
 * Add your custom job definitions here.
 */
export function registerAllJobs(agenda: Agenda): void {
  console.log('[Jobs] Registering job definitions...');

  // Example cleanup job — replace with your own work.
  agenda.define('example-cleanup', async () => {
    console.log('[Jobs] Running example cleanup...');
  });

  // GSC page-indexing sync — only registered when the feature is on.
  // Submits changed marketing pages to Google's Indexing API and
  // re-checks their indexed status on a recurring schedule.
  if (siteConfig.features.gscIndexing) {
    definePageIndexingSyncJob(agenda);
  }

  console.log('[Jobs] All jobs registered');
}

/**
 * Schedule recurring jobs.
 *
 * Agenda persists each scheduled job in the agendaJobs collection
 * keyed by name, so calling agenda.every() repeatedly is safe — it
 * upserts.
 */
export async function scheduleRecurringJobs(agenda: Agenda): Promise<void> {
  console.log('[Jobs] Scheduling recurring jobs...');

  // Example: Run cleanup daily at 3 AM UTC
  // await agenda.every('0 3 * * *', 'example-cleanup', {}, { skipImmediate: true });

  if (siteConfig.features.gscIndexing) {
    // Page-indexing sync — every 30 min.  Submit changed pages, then
    // inspect indexed status of pending ones.  Single GSC property →
    // single rate-limit lane, so concurrency is 1 by job-definition.
    await agenda.every('*/30 * * * *', 'page-indexing-sync', {}, {
      skipImmediate: true,
    });
  }

  console.log('[Jobs] Recurring jobs scheduled');
}

export { definePageIndexingSyncJob };

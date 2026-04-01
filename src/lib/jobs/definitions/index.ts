import Agenda from 'agenda';

export type JobName = 'example-cleanup';

/**
 * Register all job definitions with Agenda.
 * Add your custom job definitions here.
 */
export function registerAllJobs(agenda: Agenda): void {
  console.log('[Jobs] Registering job definitions...');

  // Example: a cleanup job that runs periodically
  agenda.define('example-cleanup', async () => {
    console.log('[Jobs] Running example cleanup...');
    // Add your cleanup logic here
  });

  console.log('[Jobs] All jobs registered');
}

/**
 * Schedule recurring jobs.
 * Add your cron-based schedules here.
 */
export async function scheduleRecurringJobs(agenda: Agenda): Promise<void> {
  console.log('[Jobs] Scheduling recurring jobs...');

  // Example: Run cleanup daily at 3 AM UTC
  // await agenda.every('0 3 * * *', 'example-cleanup', {}, { skipImmediate: true });

  console.log('[Jobs] Recurring jobs scheduled');
}

/**
 * Background Worker Entry Point
 *
 * Run with: npm run worker  (or `npm run worker:dev` for tsx watch mode)
 *
 * The worker:
 * 1. Initializes secrets (separate process, needs its own Infisical init)
 * 2. Connects to MongoDB and Redis
 * 3. Registers all job definitions
 * 4. Schedules recurring jobs
 * 5. Starts processing jobs from the queue
 * 6. Handles graceful shutdown (SIGTERM / SIGINT / uncaught errors)
 */

import { getAgenda, stopAgenda } from '../jobs/agenda';
import { registerAllJobs, scheduleRecurringJobs } from '../jobs/definitions';
import { connectDB } from '../db/connection';
import { getRedisClient, closeRedis } from '../cache/redis-client';
import { initSecrets } from '../secrets/secrets-manager';

let isShuttingDown = false;

async function startWorker(): Promise<void> {
  console.log('=========================================');
  console.log('[Worker] Starting Background Worker');
  console.log('[Worker] PID:', process.pid);
  console.log('[Worker] Node:', process.version);
  console.log('=========================================');

  try {
    // Step 0: Initialize secrets (worker is a separate process, so it
    // needs its own Infisical init even if the web server already did one).
    console.log('[Worker] Initializing secrets...');
    await initSecrets();

    // Step 1: Connect to databases
    console.log('[Worker] Connecting to MongoDB...');
    await connectDB();
    console.log('[Worker] MongoDB connected');

    console.log('[Worker] Connecting to Redis...');
    getRedisClient();
    console.log('[Worker] Redis connected');

    // Step 2: Get Agenda instance
    console.log('[Worker] Initializing Agenda...');
    const agenda = await getAgenda();

    // Step 3: Register job definitions
    registerAllJobs(agenda);

    // Step 4: Start Agenda job processing
    console.log('[Worker] Starting Agenda job processing...');
    await agenda.start();
    console.log('[Worker] Agenda job processor started');

    // Step 5: Schedule recurring jobs
    try {
      await scheduleRecurringJobs(agenda);
    } catch (err) {
      console.error('[Worker] Failed to schedule recurring jobs:', err);
    }

    console.log('=========================================');
    console.log('[Worker] Worker started successfully!');
    console.log('[Worker] Listening for jobs...');
    console.log('=========================================');

    // Log registered jobs for visibility
    const definitions = (agenda as unknown as { _definitions?: Record<string, unknown> })._definitions || {};
    console.log('[Worker] Registered jobs:', Object.keys(definitions).join(', '));
  } catch (error) {
    console.error('[Worker] Failed to start:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log('[Worker] Shutdown already in progress...');
    return;
  }
  isShuttingDown = true;
  console.log(`[Worker] Received ${signal}, shutting down gracefully...`);

  try {
    // Step 1: Stop accepting new jobs
    console.log('[Worker] Stopping Agenda...');
    await stopAgenda();

    // Step 2: Release any distributed locks held by this process so
    // another replica can pick up work immediately.
    try {
      console.log('[Worker] Releasing distributed locks...');
      const { getDistributedLock } = await import('../jobs/utils/distributed-lock');
      const lock = getDistributedLock();
      await lock.releaseAll();
    } catch (err) {
      console.warn('[Worker] Lock release skipped:', err instanceof Error ? err.message : err);
    }

    // Step 3: Close Redis connection
    console.log('[Worker] Closing Redis...');
    await closeRedis();

    console.log('[Worker] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Worker] Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  console.error('[Worker] Uncaught exception:', error);
  gracefulShutdown('uncaughtException').catch(() => process.exit(1));
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Worker] Unhandled rejection:', reason);
  gracefulShutdown('unhandledRejection').catch(() => process.exit(1));
});

startWorker();

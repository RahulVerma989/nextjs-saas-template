/**
 * Agenda.js Instance Setup
 *
 * Configures the job queue using MongoDB for persistence.
 * Shared between the main app (for job creation) and the worker (for
 * processing).
 *
 * Agenda v6 split storage out of core, so we plug in
 * @agendajs/mongo-backend here.  No more v5 driver-compat shims —
 * v6 targets the modern MongoDB driver natively.
 */

import { Agenda } from 'agenda';
import { MongoBackend } from '@agendajs/mongo-backend';
import { connectDB } from '@/lib/db/connection';
import mongoose from 'mongoose';
import type { Db } from 'mongodb';

// Singleton state
let agenda: Agenda | null = null;
let isInitializing = false;

const agendaConfig = {
  processEvery: '10 seconds', // How often to poll for new jobs
  maxConcurrency: 10, // Max concurrent jobs across all job types
  defaultConcurrency: 5, // Default concurrency per job type
  lockLimit: 20, // Max jobs to lock at once
  defaultLockLimit: 5, // Default per job type
  defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
};

/**
 * Get or create Agenda instance.
 * Uses the existing Mongoose connection's Db so we don't open a
 * second pool for the agendaJobs collection.
 */
export async function getAgenda(): Promise<Agenda> {
  if (agenda) return agenda;

  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (agenda) return agenda;
  }

  isInitializing = true;

  try {
    await connectDB();
    const mongoConnection = mongoose.connection;
    if (!mongoConnection.db) {
      throw new Error('MongoDB database not available');
    }

    // Mongoose's Db type comes from the bundled mongodb package, which
    // is the same v6 driver @agendajs/mongo-backend expects.  The cast
    // is a no-op at runtime — it just papers over the structural type
    // identity check across the two copies of mongodb in our deps.
    const db = mongoConnection.db as unknown as Db;

    agenda = new Agenda({
      backend: new MongoBackend({ mongo: db }),
      processEvery: agendaConfig.processEvery,
      maxConcurrency: agendaConfig.maxConcurrency,
      defaultConcurrency: agendaConfig.defaultConcurrency,
      lockLimit: agendaConfig.lockLimit,
      defaultLockLimit: agendaConfig.defaultLockLimit,
      defaultLockLifetime: agendaConfig.defaultLockLifetime,
    });

    setupEventHandlers(agenda);

    console.log('[Agenda] Instance created successfully');
    return agenda;
  } catch (error) {
    console.error('[Agenda] Failed to create instance:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

function setupEventHandlers(agendaInstance: Agenda): void {
  agendaInstance.on('ready', () => {
    console.log('[Agenda] Ready and connected to MongoDB');
  });

  agendaInstance.on('error', (error: Error) => {
    console.error('[Agenda] Error:', error.message);
  });

  agendaInstance.on('start', (job) => {
    console.log(`[Agenda] Job started: ${job.attrs.name}`, {
      jobId: job.attrs._id?.toString(),
    });
  });

  agendaInstance.on('complete', (job) => {
    const duration = job.attrs.lastRunAt
      ? Date.now() - new Date(job.attrs.lastRunAt).getTime()
      : 0;
    console.log(`[Agenda] Job completed: ${job.attrs.name}`, {
      jobId: job.attrs._id?.toString(),
      durationMs: duration,
    });
  });

  agendaInstance.on('success', (job) => {
    console.log(`[Agenda] Job succeeded: ${job.attrs.name}`, {
      jobId: job.attrs._id?.toString(),
    });
  });

  agendaInstance.on('fail', (error: Error, job) => {
    console.error(`[Agenda] Job failed: ${job.attrs.name}`, {
      jobId: job.attrs._id?.toString(),
      error: error.message,
      failCount: job.attrs.failCount,
    });
  });
}

export async function stopAgenda(): Promise<void> {
  if (!agenda) return;
  console.log('[Agenda] Stopping gracefully...');
  try {
    await agenda.stop();
    agenda = null;
    console.log('[Agenda] Stopped successfully');
  } catch (error) {
    console.error('[Agenda] Error stopping:', error);
    throw error;
  }
}

export function isAgendaRunning(): boolean {
  return agenda !== null;
}

export { agendaConfig };

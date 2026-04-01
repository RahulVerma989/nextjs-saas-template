import Agenda from 'agenda';
import { connectDB } from '@/lib/db/connection';
import mongoose from 'mongoose';

let agenda: Agenda | null = null;
let isInitializing = false;

const agendaConfig = {
  processEvery: '10 seconds',
  maxConcurrency: 10,
  defaultConcurrency: 5,
  lockLimit: 20,
  defaultLockLimit: 5,
  defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
};

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agenda = new Agenda({
      mongo: mongoConnection.db as any,
      processEvery: agendaConfig.processEvery,
      maxConcurrency: agendaConfig.maxConcurrency,
      defaultConcurrency: agendaConfig.defaultConcurrency,
      lockLimit: agendaConfig.lockLimit,
      defaultLockLimit: agendaConfig.defaultLockLimit,
      defaultLockLifetime: agendaConfig.defaultLockLifetime,
    } as any);

    // Fix for Agenda v5 + MongoDB driver v6 callback interop issue
    const a = agenda as Record<string, unknown>;
    if (a._collection) {
      const col = a._collection as import('mongodb').Collection;
      col
        .createIndex(
          { name: 1, nextRunAt: 1, priority: -1, lockedAt: 1, lastFinishedAt: 1, disabled: 1 },
          { name: 'findAndLockNextJobIndex', background: true }
        )
        .then(() => console.log('[Agenda] Job indexes ensured'))
        .catch((err) => console.warn('[Agenda] Index creation warning:', err instanceof Error ? err.message : err));

      a._ready = Promise.resolve(col);
    }

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
  agendaInstance.on('ready', () => console.log('[Agenda] Ready'));
  agendaInstance.on('error', (error: Error) => console.error('[Agenda] Error:', error.message));

  agendaInstance.on('start', (job) => {
    console.log(`[Agenda] Job started: ${job.attrs.name}`, {
      jobId: job.attrs._id?.toString(),
    });
  });

  agendaInstance.on('complete', (job) => {
    const duration = job.attrs.lastRunAt
      ? Date.now() - new Date(job.attrs.lastRunAt).getTime()
      : 0;
    console.log(`[Agenda] Job completed: ${job.attrs.name} (${duration}ms)`);
  });

  agendaInstance.on('fail', (error: Error, job) => {
    console.error(`[Agenda] Job failed: ${job.attrs.name}`, {
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

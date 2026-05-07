export async function register() {
  // Only run on the Node.js server (not Edge runtime).
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Secrets are required: if Infisical can't be reached after the
  // bounded retry inside initSecrets(), exit so the process supervisor
  // (Dokploy / PM2 / Docker) restarts the container.  Running with
  // missing secrets silently was the failure mode that took the server
  // down on the last VPS reboot.
  try {
    const { initSecrets } = await import('@/lib/secrets/secrets-manager');
    await initSecrets();
    console.log('[Instrumentation] Secrets initialized');
  } catch (err) {
    console.error('[Instrumentation] Fatal: secrets init failed, exiting:', err);
    process.exit(1);
  }

  // Pre-warm Mongo and Redis so the first API request doesn't pay
  // cold-start latency.  External clients (especially MCP / OAuth
  // tooling) may cancel slow first requests, so a cold path of
  //   Redis-connect → Mongo-connect → auth lookup
  // can blow past the timeout window even though the server is healthy.
  try {
    const { connectDB } = await import('@/lib/db/connection');
    await connectDB();
    console.log('[Instrumentation] MongoDB warmed');
  } catch (err) {
    console.error(
      '[Instrumentation] MongoDB warmup failed (will retry on demand):',
      err,
    );
  }

  try {
    const { getRedisClient } = await import('@/lib/cache/redis-client');
    await getRedisClient().ping();
    console.log('[Instrumentation] Redis warmed');
  } catch (err) {
    console.error(
      '[Instrumentation] Redis warmup failed (will retry on demand):',
      err,
    );
  }

  // Schedule the GSC page-indexing sync once secrets are ready.  The
  // sync itself runs after a configurable settle delay (default 60s)
  // so the deploy has time to flip live before we HEAD-check + submit
  // URLs to Google.  Distributed-locked on the manifest's buildId so
  // multiple replicas only do it once per deploy.
  try {
    const { siteConfig } = await import('@/config/site.config');
    if (siteConfig.features.gscIndexing && siteConfig.features.backgroundServices) {
      const { scheduleSyncOnBoot } = await import(
        '@/lib/services/page-indexing.service'
      );
      scheduleSyncOnBoot();
      console.log('[Instrumentation] Page-indexing sync scheduled');
    }
  } catch (err) {
    console.error(
      '[Instrumentation] Failed to schedule page-indexing sync:',
      err,
    );
  }

  // Check for template updates in the background (non-blocking).
  checkForUpdates().catch(() => {});
}

async function checkForUpdates() {
  const { siteConfig } = await import('@/config/site.config');
  const { updates } = siteConfig;

  if (!updates.enabled || !updates.repo) return;

  const res = await fetch(
    `https://api.github.com/repos/${updates.repo}/releases/latest`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': siteConfig.name,
      },
    },
  );

  if (!res.ok) return;

  const release = await res.json();
  if (release.prerelease) return;

  const latest = release.tag_name.replace(/^v/, '');
  const current = updates.version.replace(/^v/, '');

  if (compareVersions(current, latest) > 0) {
    console.log('');
    console.log(`  ┌─────────────────────────────────────────────────┐`);
    console.log(`  │                                                 │`);
    console.log(`  │   Update available: ${current} → ${latest.padEnd(27)}│`);
    console.log(`  │                                                 │`);
    console.log(`  │   ${`https://github.com/${updates.repo}/releases/tag/${release.tag_name}`.padEnd(46)}│`);
    console.log(`  │                                                 │`);
    console.log(`  └─────────────────────────────────────────────────┘`);
    console.log('');
  }
}

function compareVersions(current: string, latest: string): number {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return 1;
    if (lv < cv) return -1;
  }
  return 0;
}

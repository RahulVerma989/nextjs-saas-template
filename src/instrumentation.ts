export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSecrets } = await import('@/lib/secrets/secrets-manager');
    await initSecrets();
    console.log('[Instrumentation] Secrets initialized');

    // Check for template updates in the background (non-blocking)
    checkForUpdates().catch(() => {});
  }
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
    }
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

#!/usr/bin/env tsx
/**
 * Build-time script: hash every indexable marketing page's source files
 * and write src/lib/data/page-manifest.json.  The runtime page-indexing
 * service reads this manifest on boot, diffs against the stored hashes,
 * and submits URL_UPDATED for changed pages and URL_DELETED for pages
 * that were removed.
 *
 * Runs as part of `prebuild` (and `predev`) so the manifest is always
 * present when Next.js starts.  Safe to run multiple times — it's a
 * pure function of the source files on disk.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { createHash } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getIndexableRoutes } = require('../src/config/indexable-routes') as typeof import('../src/config/indexable-routes');

const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'src/lib/data/page-manifest.json');

interface ManifestEntry {
  path: string;
  group: string;
  contentHash: string;
  sourceFiles: string[];
}

interface Manifest {
  /**
   * Deterministic hash of every route's contentHash combined.  Same source
   * code = same buildId; different source = different buildId.  Used as
   * the Redis lock key on boot so concurrent replicas only run the GSC
   * sync once per deploy.
   */
  buildId: string;
  generatedAt: string;
  routes: ManifestEntry[];
}

function hashRoute(sourceFiles: string[], extra?: string): string {
  const h = createHash('sha256');
  for (const file of sourceFiles) {
    const abs = resolve(ROOT, file);
    if (!existsSync(abs)) {
      // Missing file shouldn't crash the build — record it so a future
      // appearance produces a different hash and triggers a fresh submit.
      h.update(`MISSING:${file}\n`);
      continue;
    }
    h.update(`FILE:${file}\n`);
    h.update(readFileSync(abs));
    h.update('\n');
  }
  if (extra) {
    h.update('EXTRA:');
    h.update(extra);
  }
  return h.digest('hex').slice(0, 16);
}

function main(): void {
  const routes = getIndexableRoutes();
  const entries: ManifestEntry[] = routes.map((r) => ({
    path: r.path,
    group: r.group,
    contentHash: hashRoute(r.sourceFiles, r.extraContent?.()),
    sourceFiles: r.sourceFiles,
  }));

  const buildHasher = createHash('sha256');
  for (const e of entries) {
    buildHasher.update(`${e.path}:${e.contentHash}\n`);
  }
  const buildId = buildHasher.digest('hex').slice(0, 16);

  // Use the latest source-file mtime (not Date.now()) so the manifest
  // stays stable across builds of identical source.
  let latestMtime = 0;
  for (const route of routes) {
    for (const file of route.sourceFiles) {
      const abs = resolve(ROOT, file);
      if (!existsSync(abs)) continue;
      const stat = statSync(abs);
      if (stat.mtimeMs > latestMtime) latestMtime = stat.mtimeMs;
    }
  }
  const generatedAt =
    latestMtime > 0 ? new Date(latestMtime).toISOString() : new Date(0).toISOString();

  const manifest: Manifest = { buildId, generatedAt, routes: entries };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(
    `[PageManifest] Wrote ${entries.length} routes to ${OUT.replace(ROOT + '/', '')} (buildId=${manifest.buildId})`,
  );
}

main();

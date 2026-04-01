import { NextResponse } from 'next/server';
import { siteConfig } from '@/config/site.config';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
}

// Cache the release check for 1 hour
let cachedRelease: { data: GitHubRelease | null; checkedAt: number } | null = null;
const CACHE_TTL = 3600_000; // 1 hour

function compareVersions(current: string, latest: string): number {
  const c = current.replace(/^v/, '').split('.').map(Number);
  const l = latest.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return 1;
    if (lv < cv) return -1;
  }
  return 0;
}

export async function GET() {
  const { updates } = siteConfig;

  if (!updates.enabled || !updates.repo) {
    return NextResponse.json({ updateAvailable: false, message: 'Updates not configured' });
  }

  try {
    // Return cached if fresh
    if (cachedRelease && Date.now() - cachedRelease.checkedAt < CACHE_TTL) {
      const release = cachedRelease.data;
      if (!release) {
        return NextResponse.json({ updateAvailable: false });
      }
      const cmp = compareVersions(updates.version, release.tag_name);
      return NextResponse.json({
        updateAvailable: cmp > 0,
        currentVersion: updates.version,
        latestVersion: release.tag_name,
        releaseName: release.name,
        releaseNotes: release.body?.slice(0, 500),
        releaseUrl: release.html_url,
        publishedAt: release.published_at,
      });
    }

    // Fetch latest release from GitHub
    const res = await fetch(
      `https://api.github.com/repos/${updates.repo}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': siteConfig.name,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      cachedRelease = { data: null, checkedAt: Date.now() };
      return NextResponse.json({ updateAvailable: false });
    }

    const release: GitHubRelease = await res.json();
    cachedRelease = { data: release, checkedAt: Date.now() };

    if (release.prerelease) {
      return NextResponse.json({ updateAvailable: false });
    }

    const cmp = compareVersions(updates.version, release.tag_name);

    return NextResponse.json({
      updateAvailable: cmp > 0,
      currentVersion: updates.version,
      latestVersion: release.tag_name,
      releaseName: release.name,
      releaseNotes: release.body?.slice(0, 500),
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
    });
  } catch (error) {
    console.error('[Updates] Failed to check for updates:', error);
    return NextResponse.json({ updateAvailable: false });
  }
}

/**
 * Single source of truth for "marketing URLs that should be tracked
 * for Google Search Console indexing."  Used by:
 *
 *   - scripts/build-page-manifest.ts (build-time hashing)
 *   - src/lib/services/page-indexing.service.ts (runtime sync)
 *
 * Each route lists the source files whose content determines whether the
 * rendered page has changed.  We hash those files at build time, store
 * the hash on a PageIndex doc, and on the next deploy compare the new
 * hash against the stored one — different hash → re-submit URL_UPDATED.
 *
 * Skip routes that shouldn't be auto-submitted:
 *   - /login, /dashboard/*, /api/*  → not public marketing pages
 *
 * Add your own routes by extending the returned array.  For dynamic
 * routes (e.g. /blog/[slug]), use `extraContent` to mix the slug data
 * into the hash so a copy edit on one slug only re-submits that URL.
 */

const APP = 'src/app';

export interface IndexableRoute {
  /** URL path on your domain (no trailing slash, no host). */
  path: string;
  /** Files whose content should be hashed for change detection. */
  sourceFiles: string[];
  /**
   * Optional extra string mixed into the hash.  Used by dynamic routes
   * where the per-slug data lives in a config file, not the page file.
   */
  extraContent?: () => string;
  /** Group label for the admin UI. */
  group: 'home' | 'legal' | 'marketing' | 'docs' | 'other';
}

export function getIndexableRoutes(): IndexableRoute[] {
  return [
    {
      path: '/',
      group: 'home',
      sourceFiles: [`${APP}/page.tsx`, `${APP}/layout.tsx`],
    },
    {
      path: '/privacy',
      group: 'legal',
      sourceFiles: [`${APP}/(legal)/privacy/page.tsx`, `${APP}/(legal)/layout.tsx`],
    },
    {
      path: '/terms',
      group: 'legal',
      sourceFiles: [`${APP}/(legal)/terms/page.tsx`, `${APP}/(legal)/layout.tsx`],
    },
    {
      path: '/contact',
      group: 'legal',
      sourceFiles: [`${APP}/(legal)/contact/page.tsx`, `${APP}/(legal)/layout.tsx`],
    },
  ];
}

import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

/**
 * Main sitemap.  Add your own marketing routes (tools, comparisons,
 * guides, dynamic [slug] pages) by extending the returned array.  For
 * dynamic routes, fetch slugs from your DB / config and `.map(...)`
 * them into entries.
 *
 * If you split sitemaps later (e.g. /blog/sitemap.xml), make sure to
 * also list them in src/app/robots.ts so Google picks them all up.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Only advertise /login when auth is enabled.  When the feature is
  // off, the route is hidden from the dashboard layout and shouldn't
  // appear in the sitemap either.
  if (siteConfig.features.auth) {
    entries.push({
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  return entries;
}

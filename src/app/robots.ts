import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/utils/site-url';

// `headers()` inside getSiteUrl() opts this route into dynamic rendering,
// so the URL always reflects the actual request host.
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    // List every sitemap your site exposes here.  Add more entries
    // (e.g. `${baseUrl}/blog/sitemap.xml`) when you split sitemaps.
    sitemap: [`${baseUrl}/sitemap.xml`],
  };
}

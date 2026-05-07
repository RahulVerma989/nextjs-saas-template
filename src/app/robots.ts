import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

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

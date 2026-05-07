import { siteConfig } from '@/config/site.config';

export const runtime = 'nodejs';

/**
 * /llms.txt — points LLM crawlers (ChatGPT, Claude, Perplexity, etc.)
 * at the canonical pages and APIs they should consume.  Equivalent to
 * robots.txt but for AI agents — see https://llmstxt.org/.
 *
 * Customize the body below as you add public APIs / docs.
 */
export async function GET() {
  const baseUrl = siteConfig.url;

  const body = `# ${siteConfig.name}

> ${siteConfig.description}

## About
${siteConfig.name} is built with Next.js.  These are the pages and
endpoints intended for AI assistants and LLM crawlers.

## Canonical pages
- Home: ${baseUrl}
- Terms: ${baseUrl}/terms
- Privacy: ${baseUrl}/privacy
- Contact: ${baseUrl}/contact

## Sitemaps
- ${baseUrl}/sitemap.xml

## Contact
${siteConfig.support.email}
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

import { headers } from 'next/headers';
import { siteConfig } from '@/config/site.config';

/**
 * Resolve the site's canonical URL at request time.
 *
 * Why request-time:
 *   - `NEXT_PUBLIC_*` env vars are inlined into the JS bundle at build
 *     time.  If you change one in a runtime env panel (e.g. Dokploy's
 *     "Environment" tab) without also setting it as a Docker build arg,
 *     the change has no effect on prerendered pages — the old value
 *     stays baked into the HTML.
 *   - Reading from request headers makes the URL track whatever domain
 *     the user actually visits, with no rebuild required.  Set the env
 *     var once in Dokploy and re-deploy: it works.  Move to a different
 *     domain: it still works.
 *
 * Resolution order:
 *   1. `x-forwarded-host` + `x-forwarded-proto`   (Dokploy's Traefik /
 *      any standard reverse proxy)
 *   2. `host` header                               (direct connection)
 *   3. `process.env.NEXT_PUBLIC_APP_URL`           (server runtime env
 *      var, also picked up at build time if set as a build arg)
 *   4. `http://localhost:3000`                     (local dev fallback)
 *
 * Note: routes that call this become dynamic — `headers()` opts them
 * out of static prerendering.  That's the right trade-off for metadata
 * (which has to reflect the current request), but if you have a route
 * you want to keep statically prerendered, derive its URL from
 * `siteConfig.url` directly instead.
 */
export async function getSiteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) {
      const proto =
        h.get('x-forwarded-proto') ??
        (process.env.NODE_ENV === 'production' ? 'https' : 'http');
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws outside a request context (e.g. when this helper
    // is called during a build-time prerender that hasn't yet been
    // forced dynamic).  Fall through to the env-var fallback.
  }
  return siteConfig.url;
}

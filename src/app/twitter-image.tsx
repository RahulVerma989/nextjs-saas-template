/**
 * Static Twitter card image for the homepage.
 *
 * Next.js renders this at BUILD TIME and serves it as a static PNG at
 * /opengraph-image — no dynamic rendering at request time.  This is
 * critical for Twitter/X whose bot has a very short timeout (~5s) and
 * silently drops dynamically-generated images that take too long to
 * render.
 *
 * Pulls colors / brand from siteConfig so changing your brand updates
 * the image automatically on the next build.
 */
import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site.config';
import { LUCIDE_PATHS } from '@/lib/icons/lucide-paths';

export const runtime = 'nodejs';
// Pre-render at build time, revalidate once per day.
export const revalidate = 86400;
export const alt = `${siteConfig.name} — ${siteConfig.description}`;
export const size = {
  width: siteConfig.seo.ogImage.width,
  height: siteConfig.seo.ogImage.height,
};
export const contentType = 'image/png';

/**
 * Build the brand icon as a base64 data URL so we can render it via
 * `<img>` inside Satori (next/og's renderer).  Rendering SVG
 * `<path>`/`<circle>` children directly inside a JSX `<svg>` causes
 * Satori to emit "Cannot convert a Symbol value to a string" — the
 * data-URL `<img>` path avoids React Fragment / array-children
 * limitations entirely.
 */
function buildBrandIconDataUrl(): string | null {
  if (siteConfig.brandIcon.type !== 'lucide') return null;
  const data = LUCIDE_PATHS[siteConfig.brandIcon.name];
  if (!data) return null;

  const viewBox = data.viewBox ?? '0 0 24 24';
  const paths = data.paths.map((d) => `<path d="${d}"/>`).join('');
  const circles = (data.circles ?? [])
    .map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}${circles}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default function TwitterImage() {
  const primary = siteConfig.theme.primaryColor;
  const accent = siteConfig.theme.accentColor;
  const bgFrom = siteConfig.seo.ogBackground.from;
  const bgTo = siteConfig.seo.ogBackground.to;

  const iconDataUrl = buildBrandIconDataUrl();
  const initial = siteConfig.name.charAt(0);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: `linear-gradient(180deg, ${bgFrom} 0%, ${bgTo} 100%)`,
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
          }}
        />

        {/* Top: Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              backgroundColor: primary,
              borderRadius: 16,
            }}
          >
            {iconDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconDataUrl} alt="" width={32} height={32} />
            ) : (
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: 'white',
                }}
              >
                {initial}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            {siteConfig.name}
          </span>
        </div>

        {/* Center: Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              maxWidth: 1000,
            }}
          >
            {siteConfig.name}
          </h1>
          <p
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: '#475569',
              margin: 0,
              marginTop: 8,
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            {siteConfig.description}
          </p>
        </div>

        {/* Bottom: URL + CTA pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 28,
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {new URL(siteConfig.url).host}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 40px',
              backgroundColor: primary,
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 700,
              color: 'white',
            }}
          >
            Get started
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

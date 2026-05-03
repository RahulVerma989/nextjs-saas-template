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

export default function TwitterImage() {
  const primary = siteConfig.theme.primaryColor;
  const accent = siteConfig.theme.accentColor;
  const bgFrom = siteConfig.seo.ogBackground.from;
  const bgTo = siteConfig.seo.ogBackground.to;

  // Resolve the brand icon SVG body (lucide name → path data) so it
  // renders inside Satori, which doesn't support lucide-react.
  let iconChildren: React.ReactNode = null;
  let iconViewBox = '0 0 24 24';
  if (siteConfig.brandIcon.type === 'lucide') {
    const data = LUCIDE_PATHS[siteConfig.brandIcon.name];
    if (data) {
      iconViewBox = data.viewBox ?? '0 0 24 24';
      iconChildren = (
        <>
          {data.paths.map((d, i) => (
            <path key={`p-${i}`} d={d} />
          ))}
          {(data.circles ?? []).map((c, i) => (
            <circle key={`c-${i}`} cx={c.cx} cy={c.cy} r={c.r} />
          ))}
        </>
      );
    }
  }

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
            {iconChildren ? (
              <svg
                width="32"
                height="32"
                viewBox={iconViewBox}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {iconChildren}
              </svg>
            ) : (
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: 'white',
                }}
              >
                {siteConfig.name.charAt(0)}
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

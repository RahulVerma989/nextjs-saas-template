import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site.config';
import { LUCIDE_PATHS } from '@/lib/icons/lucide-paths';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const primaryColor = siteConfig.theme.primaryColor;
  const brand = siteConfig.brandIcon;

  // Resolve SVG children based on the configured brand icon type
  let svgPaths: string[] = [];
  let svgCircles: { cx: number; cy: number; r: number }[] = [];
  let viewBox = '0 0 24 24';
  let fallback = false;

  if (brand.type === 'lucide') {
    const data = LUCIDE_PATHS[brand.name];
    if (data) {
      svgPaths = data.paths;
      svgCircles = data.circles ?? [];
      viewBox = data.viewBox ?? '0 0 24 24';
    } else {
      fallback = true;
    }
  } else if (brand.type === 'svg-inline') {
    const inline = brand as unknown as { d: string; viewBox?: string };
    svgPaths = [inline.d];
    viewBox = inline.viewBox ?? '0 0 24 24';
  } else {
    // For 'svg' (external file) we can't load at build time -- fall back to initial
    fallback = true;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: primaryColor,
          borderRadius: 36,
        }}
      >
        {!fallback && (svgPaths.length > 0 || svgCircles.length > 0) ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="120"
            viewBox={viewBox}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {svgPaths.map((d, i) => (
              <path key={`p-${i}`} d={d} />
            ))}
            {svgCircles.map((c, i) => (
              <circle
                key={`c-${i}`}
                cx={c.cx}
                cy={c.cy}
                r={c.r}
              />
            ))}
          </svg>
        ) : (
          <span
            style={{
              fontSize: 100,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {siteConfig.name.charAt(0)}
          </span>
        )}
      </div>
    ),
    { ...size },
  );
}

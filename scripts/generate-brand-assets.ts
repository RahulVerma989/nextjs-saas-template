/**
 * Brand Asset Generator
 *
 * Generates all favicon/icon files from siteConfig as the single source
 * of truth.  Adapts to:
 *   - siteConfig.theme.primaryColor (background color)
 *   - siteConfig.brandIcon          (lucide name | inline svg path)
 *
 * Uses src/lib/icons/lucide-paths.ts so we don't need to parse the
 * lucide-react bundle at script time.  Hashes the inputs and writes
 * public/.brand-version so it's a no-op when nothing changed.
 *
 * Run: npm run generate-icons
 * Auto-runs via the predev / prebuild hooks in package.json.
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import sharp from 'sharp';

// Dynamic-require both config files at runtime so this script doesn't
// need a tsconfig-paths setup.  tsx resolves the .ts files for us.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { siteConfig } = require('../src/config/site.config') as typeof import('../src/config/site.config');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LUCIDE_PATHS } = require('../src/lib/icons/lucide-paths') as typeof import('../src/lib/icons/lucide-paths');

const ROOT = resolve(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const VERSION_FILE = join(PUBLIC, '.brand-version');

const PRIMARY_COLOR: string = siteConfig.theme.primaryColor;
const BRAND_ICON = siteConfig.brandIcon;

// ─── Resolve SVG body for the configured brand icon ───────────

function resolveBrandSvgBody(): { body: string; viewBox: string } {
  if (BRAND_ICON.type === 'lucide') {
    const data = LUCIDE_PATHS[BRAND_ICON.name];
    if (!data) {
      throw new Error(
        `Lucide icon "${BRAND_ICON.name}" not found in src/lib/icons/lucide-paths.ts. ` +
          `Add it there (data from https://unpkg.com/lucide-static/icons/<name>.svg) ` +
          `or pick an icon that's already listed.`,
      );
    }
    const paths = data.paths.map((d) => `<path d="${d}"/>`).join('');
    const circles = (data.circles ?? [])
      .map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/>`)
      .join('');
    return {
      body: paths + circles,
      viewBox: data.viewBox ?? '0 0 24 24',
    };
  }

  // svg-inline form: { type: 'svg-inline', d, viewBox }
  // Cast through unknown because the union narrows to this branch only
  // when the type discriminator isn't 'lucide'.
  const inline = BRAND_ICON as unknown as { d?: string; viewBox?: string };
  if (inline.d) {
    return {
      body: `<path d="${inline.d}"/>`,
      viewBox: inline.viewBox ?? '0 0 24 24',
    };
  }

  throw new Error(
    `Unsupported siteConfig.brandIcon type: ${BRAND_ICON.type}. ` +
      `Use 'lucide' or 'svg-inline' to enable favicon generation.`,
  );
}

// ─── Build master SVG at a given size ─────────────────────────

function buildMasterSvg(
  size: number,
  iconBody: string,
  iconViewBox: string,
  color: string,
): string {
  const radius = Math.round(size * 0.22);

  // Lucide-style viewBoxes are 24×24; icon occupies 70% of canvas, centered.
  const [, , vbW, vbH] = iconViewBox.split(/\s+/).map(Number);
  const iconBoxW = Number.isFinite(vbW) && vbW > 0 ? vbW : 24;
  const iconBoxH = Number.isFinite(vbH) && vbH > 0 ? vbH : 24;
  const iconScale = (size * 0.7) / Math.max(iconBoxW, iconBoxH);
  const offsetX = (size - iconBoxW * iconScale) / 2;
  const offsetY = (size - iconBoxH * iconScale) / 2;
  const strokeWidth = size <= 48 ? 2 : 1.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${color}"/>
  <g transform="translate(${offsetX}, ${offsetY}) scale(${iconScale})" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${iconBody}
  </g>
</svg>`;
}

// ─── Asset matrix ─────────────────────────────────────────────

interface AssetConfig {
  filename: string;
  size: number;
}

const ASSETS: AssetConfig[] = [
  { filename: 'favicon-16x16.png', size: 16 },
  { filename: 'favicon-32x32.png', size: 32 },
  { filename: 'favicon-48x48.png', size: 48 },
  { filename: 'apple-touch-icon.png', size: 180 },
  { filename: 'android-chrome-192x192.png', size: 192 },
  { filename: 'android-chrome-512x512.png', size: 512 },
];

// ─── Multi-size ICO builder ───────────────────────────────────

function buildIco(pngs: Buffer[], sizes: number[]): Buffer {
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * pngs.length;
  let dataOffset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = ICO
  header.writeUInt16LE(pngs.length, 4); // image count

  const dirEntries = Buffer.alloc(dirSize);
  for (let i = 0; i < pngs.length; i++) {
    const offset = i * dirEntrySize;
    const size = sizes[i] >= 256 ? 0 : sizes[i];
    dirEntries.writeUInt8(size, offset);
    dirEntries.writeUInt8(size, offset + 1);
    dirEntries.writeUInt8(0, offset + 2);
    dirEntries.writeUInt8(0, offset + 3);
    dirEntries.writeUInt16LE(1, offset + 4);
    dirEntries.writeUInt16LE(32, offset + 6);
    dirEntries.writeUInt32LE(pngs[i].length, offset + 8);
    dirEntries.writeUInt32LE(dataOffset, offset + 12);
    dataOffset += pngs[i].length;
  }

  return Buffer.concat([header, dirEntries, ...pngs]);
}

// ─── Webmanifest ──────────────────────────────────────────────

function buildWebmanifest(): string {
  return JSON.stringify(
    {
      name: siteConfig.name,
      short_name: siteConfig.name,
      description: siteConfig.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: PRIMARY_COLOR,
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2,
  );
}

// ─── Main ─────────────────────────────────────────────────────

async function generateAssets() {
  const iconLabel =
    BRAND_ICON.type === 'lucide' ? `lucide:${BRAND_ICON.name}` : BRAND_ICON.type;
  console.log(`[brand-assets] Resolving icon: ${iconLabel}`);
  const { body: iconBody, viewBox: iconViewBox } = resolveBrandSvgBody();

  const hashInput = `${PRIMARY_COLOR}|${iconLabel}|${iconViewBox}|${iconBody}|${siteConfig.name}|${siteConfig.description}`;
  const hash = createHash('md5').update(hashInput).digest('hex');

  if (existsSync(VERSION_FILE)) {
    const existing = readFileSync(VERSION_FILE, 'utf8').trim();
    if (existing === hash) {
      console.log('[brand-assets] Assets up to date, skipping generation');
      return;
    }
    console.log('[brand-assets] Config changed, regenerating…');
  } else {
    console.log('[brand-assets] No version file, generating all assets…');
  }

  // 1. Vector favicon.svg (also referenced by webmanifest)
  const favSvg = buildMasterSvg(32, iconBody, iconViewBox, PRIMARY_COLOR);
  writeFileSync(join(PUBLIC, 'favicon.svg'), favSvg);
  console.log('[brand-assets] Generated favicon.svg');

  // 2. PNG variants
  for (const asset of ASSETS) {
    const svg = buildMasterSvg(asset.size, iconBody, iconViewBox, PRIMARY_COLOR);
    await sharp(Buffer.from(svg), { density: 384 })
      .resize(asset.size, asset.size)
      .png()
      .toFile(join(PUBLIC, asset.filename));
    console.log(`[brand-assets] Generated ${asset.filename} (${asset.size}×${asset.size})`);
  }

  // 3. Multi-size favicon.ico (16/32/48)
  const icoSizes = [16, 32, 48];
  const icoPngs: Buffer[] = [];
  for (const size of icoSizes) {
    const svg = buildMasterSvg(size, iconBody, iconViewBox, PRIMARY_COLOR);
    const png = await sharp(Buffer.from(svg), { density: 384 })
      .resize(size, size)
      .png()
      .toBuffer();
    icoPngs.push(png);
  }
  writeFileSync(join(PUBLIC, 'favicon.ico'), buildIco(icoPngs, icoSizes));
  console.log('[brand-assets] Generated favicon.ico');

  // 4. site.webmanifest
  writeFileSync(join(PUBLIC, 'site.webmanifest'), buildWebmanifest());
  console.log('[brand-assets] Generated site.webmanifest');

  // 5. Version stamp
  writeFileSync(VERSION_FILE, hash);
  console.log(`[brand-assets] Version hash: ${hash}`);
  console.log('[brand-assets] Done!');
}

generateAssets().catch((err) => {
  console.error('[brand-assets] Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});

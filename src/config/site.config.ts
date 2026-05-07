/**
 * Central site configuration.
 *
 * Update this file once — every page, email, OG image, and component
 * reads from here so your branding is consistent everywhere.
 */
export const siteConfig = {
  // ─── Branding ─────────────────────────────────────────────
  name: 'LaunchKit',
  description: 'Ship your SaaS in days, not months.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  /**
   * Brand icon configuration.
   *
   * Option 1 — Lucide icon name (recommended for quick setup):
   *   brandIcon: { type: 'lucide', name: 'Rocket' }
   *
   * Option 2 — Custom SVG path:
   *   brandIcon: { type: 'svg', path: '/logo.svg' }
   *
   * Option 3 — Inline SVG path data (for simple icons):
   *   brandIcon: { type: 'svg-inline', d: 'M12 2L2 22h20L12 2z', viewBox: '0 0 24 24' }
   */
  brandIcon: { type: 'lucide' as const, name: 'Layers' },

  // ─── Theme ────────────────────────────────────────────────
  // Hex equivalents of the OKLCH tokens in src/app/globals.css.
  // The brand-asset generator and OG/Twitter images consume hex,
  // while runtime CSS uses the OKLCH source of truth.  Update both
  // sides together when re-skinning.
  theme: {
    primaryColor: '#c2703e',   // ~ oklch(0.62 0.14 39.15) — warm copper
    accentColor: '#d4915f',    // ~ oklch(0.72 0.10 50)    — lighter copper
  },

  // ─── Social / Links ───────────────────────────────────────
  socials: {
    twitter: '',               // e.g. '@yourhandle'
    github: '',                // e.g. 'yourorg/repo'
  },

  support: {
    email: 'support@example.com',
  },

  // ─── GitHub Release Updates ───────────────────────────────
  updates: {
    /** Enable the update notification system */
    enabled: true,
    /** GitHub repo to check for releases (owner/repo format) */
    repo: 'RahulVerma989/nextjs-saas-template',   // e.g. 'yourorg/launchkit'
    /** Current version of this deployment */
    version: '1.0.0',
  },

  // ─── Credits / Token System ───────────────────────────────
  credits: {
    signupBonus: 500,
    /** Cache TTL (seconds) for credit balance lookups */
    cacheTTL: 60,
  },

  // ─── Cache TTLs (seconds) ─────────────────────────────────
  cache: {
    user: 300,
    apiKey: 600,
    general: 300,
  },

  // ─── Rate Limits ──────────────────────────────────────────
  rateLimits: {
    api: {
      windowMs: 60_000,
      maxRequests: 60,
    },
  },

  // ─── Feature Flags ────────────────────────────────────────
  //
  // Some features depend on others. If a dependency is disabled,
  // the dependent feature is auto-disabled at runtime.
  //
  //   Feature            Requires
  //   ───────────────────────────────────────────
  //   billing            auth
  //   credits            auth
  //   mcp                auth, apiKeys
  //   adminPanel         auth
  //   apiKeys            auth
  //   notifications      auth
  //   fileUploads        auth
  //   waitlist           (MongoDB must be configured)
  //   gscIndexing        auth, backgroundServices
  //
  features: {
    /** Master switch — disabling removes login, dashboard, and all auth-dependent features */
    auth: true,
    /** Show a waitlist email form on the landing page */
    waitlist: false,
    billing: true,
    credits: true,
    mcp: true,
    backgroundServices: true,
    fileUploads: true,
    adminPanel: true,
    apiKeys: true,
    notifications: true,
    darkMode: true,
    /** Auto-submit marketing pages to Google Search Console when their content changes */
    gscIndexing: true,
  },

  // ─── SEO ──────────────────────────────────────────────────
  seo: {
    /** Twitter handle for twitter:site / twitter:creator (e.g. '@yourhandle') */
    twitterHandle: '',
    /** Default OG image dimensions */
    ogImage: {
      width: 1200,
      height: 630,
    },
    /** Background gradient stops for the auto-generated OG image */
    ogBackground: {
      from: '#ffffff',
      to: '#f1f5f9',
    },
  },

  // ─── Admin ────────────────────────────────────────────────
  // Hardcoded admin emails for this deployment.  Leave empty in the
  // template; supply via the ADMIN_EMAILS env var (comma-separated)
  // so you don't have to fork the source to grant yourself admin.
  admin: {
    emails: [] as string[],
  },

  // ─── Convenience Aliases ──────────────────────────────────
  get supportEmail() {
    return this.support.email;
  },
  /**
   * Combined admin allow-list: hardcoded `admin.emails` ∪ comma-
   * separated `ADMIN_EMAILS` env var.  Lower-cased + de-duped.
   * The auth `signIn` callback reads this on every login so adding
   * an email and re-signing in is enough to grant admin.
   */
  get adminEmails(): readonly string[] {
    const fromEnv = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const fromConfig = this.admin.emails.map((e) => e.toLowerCase());
    return Array.from(new Set([...fromConfig, ...fromEnv]));
  },
} as const;

export type SiteConfig = typeof siteConfig;

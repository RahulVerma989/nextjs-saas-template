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
  brandIcon: { type: 'lucide' as const, name: 'Rocket' },

  // ─── Theme ────────────────────────────────────────────────
  theme: {
    primaryColor: '#6366f1',   // Indigo-500
    accentColor: '#8b5cf6',    // Violet-500
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
  },

  // ─── Admin ────────────────────────────────────────────────
  admin: {
    emails: [] as string[],   // e.g. ['admin@example.com']
  },

  // ─── Convenience Aliases ──────────────────────────────────
  get supportEmail() {
    return this.support.email;
  },
  get adminEmails() {
    return this.admin.emails;
  },
} as const;

export type SiteConfig = typeof siteConfig;

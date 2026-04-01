/**
 * Central site configuration.
 *
 * Update this file once — every page, email, OG image, and component
 * reads from here so your branding is consistent everywhere.
 */
export const siteConfig = {
  // ─── Branding ─────────────────────────────────────────────
  name: 'SaaS Template',
  description: 'The open-source Next.js SaaS starter with auth, billing, MCP, background services, and more.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  logo: '/logo.svg',

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
  features: {
    billing: true,
    credits: true,
    mcp: true,
    backgroundServices: true,
    fileUploads: true,
    adminPanel: true,
    apiKeys: true,
    notifications: true,
    darkMode: true,
    /** When true, the landing page shows a waitlist form instead of login */
    waitlistMode: false,
  },

  // ─── Admin ────────────────────────────────────────────────
  admin: {
    emails: [] as string[],   // e.g. ['admin@example.com']
  },
} as const;

export type SiteConfig = typeof siteConfig;

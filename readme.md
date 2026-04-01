# LaunchKit — Next.js SaaS Template

Ship your SaaS in days, not months. A production-ready Next.js starter with auth, billing, API keys, MCP, background services, and 80+ components.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.9
- **Database:** MongoDB (Mongoose 9)
- **Cache:** Redis (ioredis)
- **Auth:** NextAuth v5 (Google OAuth, JWT sessions, RBAC)
- **Billing:** Dodo Payments (subscriptions, webhooks, credit system)
- **Email:** Resend (transactional emails)
- **Storage:** S3/R2-compatible (presigned uploads)
- **Secrets:** Infisical (optional)
- **UI:** Tailwind CSS 4, shadcn/ui, dark mode
- **Jobs:** Agenda.js + background service registry
- **MCP:** JSON-RPC 2.0 with OAuth 2.1 PKCE
- **SEO:** Dynamic OG images, sitemap, robots, Twitter cards

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Google OAuth, JWT sessions, role-based access, admin auto-approval, waitlist mode |
| **Feature Flags** | Toggle auth, waitlist, billing, MCP, and more from a single config. Dependency-aware — disabling `auth` auto-disables all auth-dependent features |
| **Billing & Credits** | Dodo Payments subscriptions, append-only credit ledger, wallet top-ups |
| **Dashboard** | Responsive sidebar, plan/credits overview, settings, billing management |
| **Admin Panel** | User management, plan changes, account approval |
| **API Keys** | Create/revoke keys with per-key tool permissions |
| **MCP Framework** | Model Context Protocol server with OAuth 2.1 PKCE, rate limiting, extensible tool registry |
| **Background Services** | Service registry with Redis distributed locks, cron scheduling, MongoDB run tracking |
| **Waitlist** | Email collection form with MongoDB storage — one config toggle |
| **OG Images** | Dynamic Open Graph image generation per page with Satori |
| **Favicons** | Auto-generated from your brand icon in site config (icon.tsx + apple-icon.tsx) |
| **Sitemap** | Auto-generated sitemap.xml for all public pages |
| **Email** | Transactional templates (welcome, approval, low credit) via Resend |
| **File Storage** | S3/R2 presigned uploads with size limits |
| **Dark Mode** | System-aware theme toggle on navbar and dashboard |
| **Notifications** | In-app notification system with read/unread tracking |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance
- Redis instance (optional — features degrade gracefully)

### Setup

```bash
# Clone the repo
git clone https://github.com/RahulVerma989/nextjs-saas-template.git
cd nextjs-saas-template

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials (at minimum: AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MONGODB_URI)

# Generate AUTH_SECRET
openssl rand -base64 32

# Run development server
npm run dev

# Or run with background worker
npm run dev:all
```

### Environment Variables

See `.env.example` for all available variables. Required:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `MONGODB_URI` | MongoDB connection string |

Optional but recommended:

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection string |
| `DODO_API_KEY` | Dodo Payments API key |
| `DODO_WEBHOOK_SECRET` | Dodo webhook verification secret |
| `RESEND_API_KEY` | Resend email API key |
| `R2_*` | S3/R2 storage credentials |

## Configuration

### Site Config

Everything is driven by a single file — `src/config/site.config.ts`:

```ts
export const siteConfig = {
  name: 'YourApp',
  brandIcon: { type: 'lucide', name: 'Rocket' },
  theme: {
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6',
  },
  features: {
    auth: true,           // Master switch for login/dashboard
    waitlist: false,      // Email collection form on landing page
    billing: true,        // Requires: auth
    credits: true,        // Requires: auth
    mcp: true,            // Requires: auth, apiKeys
    apiKeys: true,        // Requires: auth
    adminPanel: true,     // Requires: auth
    notifications: true,  // Requires: auth
    darkMode: true,
    // ...
  },
};
```

Changing the brand icon automatically updates favicons, the navbar, and the sidebar. Toggling a feature flag removes it from the UI and returns 404 for its routes.

### Feature Dependencies

Some features depend on others. The feature gate system handles this automatically:

```
Feature            Requires
───────────────────────────────────
billing            auth
credits            auth
mcp                auth, apiKeys
adminPanel         auth
apiKeys            auth
notifications      auth
fileUploads        auth
waitlist           MongoDB
```

Disabling `auth` automatically disables billing, credits, API keys, admin panel, notifications, and MCP.

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login page (gated behind auth flag)
│   ├── (legal)/            # Terms, privacy, contact (shared navbar)
│   ├── api/
│   │   ├── admin/          # Admin endpoints
│   │   ├── billing/        # Subscription management
│   │   ├── checkout/       # Payment checkout
│   │   ├── credits/        # Credit balance & history
│   │   ├── mcp/            # MCP JSON-RPC endpoint
│   │   ├── oauth/          # OAuth 2.1 (authorize, token, register)
│   │   ├── og/             # Dynamic OG image generation
│   │   ├── services/       # Background service triggers
│   │   ├── waitlist/       # Waitlist email collection
│   │   └── webhooks/       # Payment & secret webhooks
│   ├── dashboard/          # Dashboard pages (gated behind auth flag)
│   ├── icon.tsx            # Dynamic favicon from site config
│   ├── apple-icon.tsx      # Dynamic Apple Touch Icon
│   └── sitemap.ts          # Auto-generated sitemap
├── components/
│   ├── layout/             # Navbar, sidebar, header, shell
│   ├── ui/                 # 28+ shadcn/Radix components
│   ├── theme-toggle.tsx    # Standalone dark mode toggle
│   └── waitlist-form.tsx   # Email collection form
├── config/                 # Site config, plans, navigation
├── lib/
│   ├── auth/               # NextAuth config & admin guard
│   ├── cache/              # Redis client & cache manager
│   ├── db/                 # MongoDB connection, models, CRUD classes
│   ├── features/           # Feature gate utility
│   ├── icons/              # Lucide SVG path data for favicons
│   ├── mcp/                # MCP rate limiter & tool registry
│   ├── og/                 # OG image renderer & service
│   ├── payments/           # Dodo client & webhook handler
│   └── services/           # Background service registry
└── types/                  # TypeScript type definitions
```

## Extending

### Adding MCP Tools

1. Define the tool in `src/config/mcp-tools.config.ts`
2. Create a handler in `src/lib/mcp/tools/definitions/`
3. Register the handler in `src/lib/mcp/tools/index.ts`

### Adding Background Services

1. Create a service definition in `src/lib/services/definitions/`
2. Register it in `src/lib/services/definitions/index.ts`

### Adding Plans

Edit `src/config/plans.config.ts` for pricing and `src/config/features.config.ts` for feature limits.

### Adding Favicon Icons

The favicon is auto-generated from your `brandIcon` in site config. To add support for more Lucide icons, add their SVG path data to `src/lib/icons/lucide-paths.ts`.

## Deployment

### Docker

```bash
docker build -t saas-template .
docker run -p 3000:3000 --env-file .env saas-template
```

### Vercel

Push to GitHub and import in Vercel. Add environment variables in the Vercel dashboard.

### Nixpacks (Railway/Render)

The included `nixpacks.toml` handles build and start configuration automatically.

## AI-Friendly Architecture

This codebase is designed to work well with AI coding tools (Claude Code, Cursor, GitHub Copilot):

- Full TypeScript with strict mode
- Consistent patterns and predictable file structure
- Clean separation of concerns with typed interfaces
- Centralized configuration — AI tools can understand the entire app by reading `site.config.ts`
- Built-in MCP protocol endpoint for AI agent integration

## License

MIT

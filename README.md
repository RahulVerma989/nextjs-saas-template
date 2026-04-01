# Next.js SaaS Template

A production-ready Next.js SaaS starter with authentication, billing, MCP framework, background services, and more.

## Tech Stack

- **Framework:** Next.js 16 with React 19, TypeScript 5.9
- **Database:** MongoDB (Mongoose 9)
- **Cache:** Redis (ioredis)
- **Auth:** NextAuth v5 (Google OAuth, JWT sessions)
- **Billing:** Dodo Payments (subscriptions, webhooks, credit system)
- **Email:** Resend (transactional emails)
- **Storage:** S3/R2-compatible (presigned uploads)
- **Secrets:** Infisical (optional)
- **UI:** Tailwind CSS 4, Shadcn/Radix, dark mode
- **Jobs:** Agenda.js + Background Service Registry
- **MCP:** JSON-RPC 2.0 with OAuth 2.1 PKCE

## Features

- **Authentication** — Google OAuth with NextAuth v5, JWT sessions, admin role auto-assignment
- **Billing & Credits** — Dodo Payments integration, subscription lifecycle, append-only credit ledger, wallet top-ups
- **Dashboard** — Responsive sidebar layout, plan/credits overview, settings, billing management
- **Admin Panel** — User management, plan changes, account approval
- **API Keys** — Create/revoke API keys with per-key tool permissions
- **MCP Framework** — Model Context Protocol server with OAuth 2.1 PKCE, rate limiting, extensible tool registry
- **Background Services** — Service registry with Redis distributed locks, cron scheduling, MongoDB run tracking
- **OG Images** — Dynamic Open Graph image generation with Satori
- **Email** — Transactional emails (welcome, approval, low credit warnings) via Resend
- **File Storage** — S3/R2 presigned uploads with configurable size limits
- **Feature Gates** — Plan-based feature limits and access control
- **Dark Mode** — System-aware theme with manual toggle
- **Notifications** — In-app notification system with read/unread tracking

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance
- Redis instance

### Setup

```bash
# Clone the repo
git clone https://github.com/rahulverma989/nextjs-saas-template.git
cd nextjs-saas-template

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
# At minimum: AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MONGODB_URI, REDIS_URL

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
| `REDIS_URL` | Redis connection string |

Optional but recommended:

| Variable | Description |
|----------|-------------|
| `DODO_API_KEY` | Dodo Payments API key |
| `DODO_WEBHOOK_SECRET` | Dodo webhook verification secret |
| `RESEND_API_KEY` | Resend email API key |
| `R2_*` | S3/R2 storage credentials |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login)
│   ├── (legal)/            # Legal pages (privacy, terms)
│   ├── api/                # API routes
│   │   ├── admin/          # Admin endpoints
│   │   ├── billing/        # Subscription management
│   │   ├── checkout/       # Payment checkout
│   │   ├── credits/        # Credit balance & history
│   │   ├── mcp/            # MCP JSON-RPC endpoint
│   │   ├── oauth/          # OAuth 2.1 (authorize, token, register)
│   │   ├── og/             # OG image generation
│   │   ├── services/       # Background service triggers
│   │   └── webhooks/       # Payment & secret webhooks
│   └── dashboard/          # Dashboard pages
├── components/
│   ├── layout/             # Sidebar, header, shell
│   ├── providers/          # Session provider
│   └── ui/                 # 28 Shadcn/Radix components
├── config/                 # Site config, plans, features, credits, navigation
├── context/                # Theme, sidebar, credits providers
├── lib/
│   ├── auth/               # NextAuth config & admin guard
│   ├── cache/              # Redis client & cache manager
│   ├── db/                 # MongoDB connection, models, CRUD classes
│   ├── email/              # Resend email client
│   ├── feature-gate/       # Plan-based feature gating
│   ├── jobs/               # Agenda.js job definitions
│   ├── mcp/                # MCP rate limiter & tool registry
│   ├── og/                 # OG image renderer
│   ├── payments/           # Dodo client & webhook handler
│   ├── secrets/            # Infisical client & secrets manager
│   ├── services/           # Background service registry
│   └── utils/              # UUID, className helpers
└── types/                  # TypeScript type definitions
```

## Customization

### Site Config

Edit `src/config/site.config.ts` to set your app name, colors, feature flags, and admin emails.

### Adding MCP Tools

1. Define the tool in `src/config/mcp-tools.config.ts`
2. Create a handler in `src/lib/mcp/tools/definitions/`
3. Register the handler in `src/lib/mcp/tools/index.ts`

### Adding Background Services

1. Create a service definition in `src/lib/services/definitions/`
2. Register it in `src/lib/services/definitions/index.ts`

### Adding Plans

Edit `src/config/plans.config.ts` for pricing and `src/config/features.config.ts` for feature limits.

## Deployment

### Docker

```bash
docker build -t saas-template .
docker run -p 3000:3000 --env-file .env saas-template
```

### Nixpacks (Railway/Render)

The included `nixpacks.toml` handles build and start configuration automatically.

## License

MIT

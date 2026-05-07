# ---- Base ----
FROM node:20-slim AS base

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Prefer `npm ci` for reproducible installs; fall back to `npm install`
# when the lockfile is out of sync with package.json (the lockfile is
# a regenerated artifact, so drift is recoverable in CI).
RUN --mount=type=cache,target=/root/.npm \
    npm ci || (echo '[deps] lockfile out of sync, falling back to npm install' && npm install --no-audit --no-fund)

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"
# Set at build time so next.config.ts assetPrefix and the metadataBase
# in src/app/layout.tsx resolve to the production URL.  Override per
# deploy via `--build-arg NEXT_PUBLIC_APP_URL=https://your.domain` (or
# in Dokploy's Build Arguments panel).  NEXT_PUBLIC_* vars are inlined
# into the JS bundle at build time — runtime env vars / Infisical
# cannot change them after the build.
ARG NEXT_PUBLIC_APP_URL=https://template.rahulverma.cc
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN --mount=type=cache,target=/app/.next/cache npm run build
RUN npm prune --omit=dev

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Production node_modules for the background worker
COPY --from=builder /app/node_modules ./node_modules

# Worker source + TypeScript config
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

# tsx is needed to run the TypeScript worker process
RUN npm install -g tsx

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Next.js server + background worker together
CMD ["sh", "-c", "node server.js & tsx src/lib/worker/index.ts & wait"]

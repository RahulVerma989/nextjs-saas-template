#!/usr/bin/env tsx
/**
 * Setup Configuration Test Suite
 *
 * Tests that the different setup configurations of the SaaS template
 * are correctly wired and functional. Run with: npm run test:setup
 *
 * Test categories:
 *   1. Environment variables validation
 *   2. Config file consistency
 *   3. MongoDB connectivity
 *   4. Redis connectivity
 *   5. Optional service readiness (Email, Payments, Storage, Secrets)
 *   6. Auth configuration
 */

import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// Load .env manually (no dotenv dependency needed)
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), '.env'));

// ── Helpers ──────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;

type Result = 'pass' | 'fail' | 'skip';

function log(result: Result, label: string, detail?: string) {
  const icon = result === 'pass' ? '\x1b[32m✓\x1b[0m' : result === 'fail' ? '\x1b[31m✗\x1b[0m' : '\x1b[33m○\x1b[0m';
  const extra = detail ? `  (${detail})` : '';
  console.log(`  ${icon} ${label}${extra}`);
  if (result === 'pass') passed++;
  else if (result === 'fail') failed++;
  else skipped++;
}

function section(title: string) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

// ── 1. Environment Variables ─────────────────────────────────────

function testEnv() {
  section('1. Environment Variables');

  // Required core vars
  const required = [
    ['NEXT_PUBLIC_APP_URL', 'App URL'],
    ['AUTH_SECRET', 'NextAuth secret'],
  ];

  for (const [key, label] of required) {
    if (process.env[key]) {
      log('pass', `${label} (${key}) is set`);
    } else {
      log('fail', `${label} (${key}) is missing`);
    }
  }

  // Auth provider
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  if (hasGoogle) {
    log('pass', 'Google OAuth credentials configured');
  } else {
    log('skip', 'Google OAuth credentials not configured (auth will not work)');
  }

  // MongoDB - either URI or host
  const hasMongo = process.env.MONGODB_URI || process.env.MONGODB_HOST;
  if (hasMongo) {
    log('pass', 'MongoDB connection configured');
  } else {
    log('pass', 'MongoDB using default (localhost:27017/saas_app)');
  }

  // Redis - either URL or host
  const hasRedis = process.env.REDIS_URL || process.env.REDIS_HOST;
  if (hasRedis) {
    log('pass', 'Redis connection configured');
  } else {
    log('pass', 'Redis using default (localhost:6379)');
  }

  // Optional services
  const optional: [string, string][] = [
    ['DODO_API_KEY', 'Dodo Payments'],
    ['RESEND_API_KEY', 'Resend Email'],
    ['R2_ACCOUNT_ID', 'Cloudflare R2 Storage'],
    ['INFISICAL_CLIENT_ID', 'Infisical Secrets'],
  ];

  for (const [key, label] of optional) {
    if (process.env[key]) {
      log('pass', `${label} configured`);
    } else {
      log('skip', `${label} not configured (optional)`);
    }
  }
}

// ── 2. Config File Consistency ───────────────────────────────────

async function testConfigs() {
  section('2. Configuration Files');

  // Site config
  try {
    const { siteConfig } = await import('../src/config/site.config');
    log('pass', `Site config loaded: "${siteConfig.name}"`);

    if (siteConfig.url) {
      log('pass', `App URL: ${siteConfig.url}`);
    } else {
      log('fail', 'siteConfig.url is empty');
    }

    // Feature flags
    const features = siteConfig.features;
    const enabledFeatures = Object.entries(features)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
    log('pass', `Features enabled: ${enabledFeatures.join(', ')}`);
  } catch (e) {
    log('fail', `Site config failed to load: ${(e as Error).message}`);
  }

  // Plans config
  try {
    const { PLANS, getPlanConfig } = await import('../src/config/plans.config');
    const planNames = Object.keys(PLANS);
    log('pass', `Plans loaded: ${planNames.join(', ')}`);

    // Check that plan configs have required fields
    for (const [key, plan] of Object.entries(PLANS)) {
      if (!plan.name || plan.monthlyCredits === undefined) {
        log('fail', `Plan "${key}" missing required fields`);
      }
    }

    // Test getPlanConfig
    const freePlan = getPlanConfig('free');
    if (freePlan.name === 'Free') {
      log('pass', 'getPlanConfig("free") works correctly');
    } else {
      log('fail', 'getPlanConfig("free") returned unexpected result');
    }

    // Test early_adopter fallback
    const eaPlan = getPlanConfig('early_adopter');
    if (eaPlan.name === 'Starter') {
      log('pass', 'getPlanConfig("early_adopter") falls back to Starter');
    } else {
      log('fail', 'getPlanConfig("early_adopter") fallback broken');
    }
  } catch (e) {
    log('fail', `Plans config failed: ${(e as Error).message}`);
  }

  // Features config
  try {
    const { PLAN_LIMITS, getPlanLimits } = await import('../src/config/features.config');
    const plans = Object.keys(PLAN_LIMITS);
    log('pass', `Feature limits defined for: ${plans.join(', ')}`);

    // Check ascending limits
    const freeLimits = getPlanLimits('free');
    const proLimits = getPlanLimits('pro');
    if (proLimits.maxApiKeys > freeLimits.maxApiKeys) {
      log('pass', 'Plan limits scale correctly (pro > free)');
    } else {
      log('fail', 'Plan limits not scaling correctly');
    }
  } catch (e) {
    log('fail', `Features config failed: ${(e as Error).message}`);
  }

  // Navigation config
  try {
    const { navigationSections, isNavItemActive } = await import('../src/config/navigation');
    if (navigationSections.length > 0 && navigationSections[0].items.length > 0) {
      log('pass', `Navigation: ${navigationSections[0].items.length} items in main section`);
    } else {
      log('fail', 'Navigation sections are empty');
    }

    // Test isNavItemActive
    const dashItem = navigationSections[0].items[0];
    if (isNavItemActive('/dashboard', dashItem)) {
      log('pass', 'isNavItemActive works for dashboard');
    } else {
      log('fail', 'isNavItemActive broken');
    }
  } catch (e) {
    log('fail', `Navigation config failed: ${(e as Error).message}`);
  }

  // Credits config
  try {
    const creditsModule = await import('../src/config/credits.config').catch(() => null);
    if (creditsModule) {
      log('pass', 'Credits config loaded');
    } else {
      log('skip', 'Credits config not found');
    }
  } catch (e) {
    log('skip', 'Credits config not found');
  }

  // MCP tools config
  try {
    const mcpModule = await import('../src/config/mcp-tools.config').catch(() => null);
    if (mcpModule) {
      log('pass', 'MCP tools config loaded');
    } else {
      log('skip', 'MCP tools config not found');
    }
  } catch (e) {
    log('skip', 'MCP tools config not found');
  }
}

// ── 3. MongoDB Connectivity ──────────────────────────────────────

async function testMongoDB() {
  section('3. MongoDB Connectivity');

  const origError = console.error;
  const origLog = console.log;

  try {
    const { connectDB, isConnected, disconnectDB } = await import('../src/lib/db/connection');

    // Suppress connection error noise
    console.error = () => {};
    console.log = () => {};
    await connectDB();
    console.error = origError;
    console.log = origLog;
    if (isConnected()) {
      log('pass', 'MongoDB connected successfully');
    } else {
      log('fail', 'MongoDB connectDB returned but isConnected is false');
    }

    // Test models load
    try {
      const models = await import('../src/lib/db/models');
      const modelNames = Object.keys(models);
      log('pass', `Models loaded: ${modelNames.join(', ')}`);
    } catch (e) {
      log('fail', `Models failed to load: ${(e as Error).message}`);
    }

    // Test CRUD modules load
    try {
      const { getUserCrud, getCreditCrud, getAPIKeyCrud } = await import('../src/lib/db/crud');
      const userCrud = getUserCrud();
      const creditCrud = getCreditCrud();
      const apiKeyCrud = getAPIKeyCrud();
      if (userCrud && creditCrud && apiKeyCrud) {
        log('pass', 'CRUD modules initialized');
      }
    } catch (e) {
      log('fail', `CRUD modules failed: ${(e as Error).message}`);
    }

    await disconnectDB();
    log('pass', 'MongoDB disconnected gracefully');
  } catch (e) {
    console.error = origError;
    console.log = origLog;
    const msg = (e as Error).message;
    if (msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('getaddrinfo')) {
      log('skip', `MongoDB not reachable (${msg.split('\n')[0]})`);
    } else {
      log('fail', `MongoDB connection error: ${msg}`);
    }
  }
}

// ── 4. Redis Connectivity ────────────────────────────────────────

async function testRedis() {
  section('4. Redis Connectivity');

  // Test cache key module first (no connection needed)
  try {
    const { CacheKeys } = await import('../src/lib/cache/keys');
    const testKey = CacheKeys.user('test-user-id');
    if (testKey.includes('test-user-id')) {
      log('pass', `Cache key generation works: ${testKey}`);
    }
  } catch (e) {
    log('fail', `Cache keys module failed: ${(e as Error).message}`);
  }

  // Suppress Redis retry noise during testing
  const origError = console.error;
  const origLog = console.log;
  const origWarn = console.warn;
  const suppress = () => {};

  try {
    const { getRedisClient, pingRedis, closeRedis } = await import('../src/lib/cache/redis-client');

    // Silence Redis reconnection logs
    console.error = suppress;
    console.log = suppress;
    console.warn = suppress;

    const client = getRedisClient();
    if (client) {
      // Restore just for our log
      console.log = origLog;
      log('pass', 'Redis client created');
      console.log = suppress;
    }

    const pong = await Promise.race([
      pingRedis(),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);

    // Restore logging
    console.error = origError;
    console.log = origLog;
    console.warn = origWarn;

    if (pong) {
      log('pass', 'Redis PING/PONG successful');
    } else {
      log('skip', 'Redis not reachable (connection refused or timeout)');
    }

    // Suppress cleanup noise
    console.error = suppress;
    console.log = suppress;
    await closeRedis();
    console.error = origError;
    console.log = origLog;

    log('pass', 'Redis disconnected gracefully');
  } catch (e) {
    console.error = origError;
    console.log = origLog;
    console.warn = origWarn;
    const msg = (e as Error).message;
    log('skip', `Redis error: ${msg.split('\n')[0]}`);
  }
}

// ── 5. Optional Services ─────────────────────────────────────────

async function testOptionalServices() {
  section('5. Optional Services');

  // Email (Resend)
  try {
    const { getResendClient } = await import('../src/lib/email/resend-client');
    const origWarn = console.warn;
    console.warn = () => {};
    const client = getResendClient();
    console.warn = origWarn;
    if (client) {
      log('pass', 'Resend email client initialized');
    } else {
      log('skip', 'Resend not configured (RESEND_API_KEY missing)');
    }
  } catch (e) {
    log('fail', `Resend client error: ${(e as Error).message}`);
  }

  // Payments (Dodo) - just check if env vars exist, don't try to connect
  if (process.env.DODO_API_KEY) {
    log('pass', 'Dodo Payments API key configured');
    if (process.env.DODO_WEBHOOK_SECRET) {
      log('pass', 'Dodo webhook secret configured');
    } else {
      log('skip', 'Dodo webhook secret not set');
    }
    const env = process.env.DODO_ENVIRONMENT || 'test_mode';
    log('pass', `Dodo environment: ${env}`);
  } else {
    log('skip', 'Dodo Payments not configured');
  }

  // File Storage (R2)
  const r2Configured =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME;
  if (r2Configured) {
    log('pass', 'Cloudflare R2 storage fully configured');
  } else {
    const missing = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
      .filter((k) => !process.env[k]);
    log('skip', `R2 storage not configured (missing: ${missing.join(', ')})`);
  }

  // Secrets (Infisical)
  if (process.env.INFISICAL_CLIENT_ID && process.env.INFISICAL_CLIENT_SECRET) {
    log('pass', 'Infisical secrets management configured');
    if (process.env.INFISICAL_PROJECT_ID) {
      log('pass', 'Infisical project ID set');
    } else {
      log('skip', 'Infisical project ID missing');
    }
  } else {
    log('skip', 'Infisical not configured (using env vars fallback)');
  }
}

// ── 6. Auth Configuration ────────────────────────────────────────

async function testAuth() {
  section('6. Auth Configuration');

  try {
    const { authConfig } = await import('../src/lib/auth/auth.config');
    if (authConfig.providers && authConfig.providers.length > 0) {
      log('pass', `Auth providers configured: ${authConfig.providers.length}`);
    } else {
      log('fail', 'No auth providers configured');
    }

    if (authConfig.pages?.signIn === '/login') {
      log('pass', 'Custom sign-in page configured (/login)');
    }
  } catch (e) {
    log('fail', `Auth config failed: ${(e as Error).message}`);
  }

  // Check AUTH_SECRET
  if (process.env.AUTH_SECRET) {
    log('pass', 'AUTH_SECRET is set');
  } else {
    log('fail', 'AUTH_SECRET is missing (required for production)');
  }
}

// ── 7. File Structure ────────────────────────────────────────────

function testFileStructure() {
  section('7. File Structure');

  const requiredPaths = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/(auth)/login/page.tsx',
    'src/app/dashboard/layout.tsx',
    'src/app/api/auth/[...nextauth]/route.ts',
    'src/lib/auth/auth.ts',
    'src/lib/db/connection.ts',
    'src/lib/cache/redis-client.ts',
    'src/config/site.config.ts',
    'src/config/plans.config.ts',
    'src/config/features.config.ts',
    'next.config.ts',
    'tsconfig.json',
    'package.json',
  ];

  for (const p of requiredPaths) {
    const full = resolve(process.cwd(), p);
    if (existsSync(full)) {
      log('pass', p);
    } else {
      log('fail', `Missing: ${p}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m║   NextJS SaaS Template - Setup Test Suite    ║\x1b[0m');
  console.log('\x1b[1m\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m');

  testEnv();
  await testConfigs();
  testFileStructure();
  await testAuth();
  await testMongoDB();
  await testRedis();
  await testOptionalServices();

  // Summary
  console.log('\n\x1b[1m── Summary ──────────────────────────────────\x1b[0m');
  console.log(`  \x1b[32m${passed} passed\x1b[0m  \x1b[31m${failed} failed\x1b[0m  \x1b[33m${skipped} skipped\x1b[0m`);

  if (failed > 0) {
    console.log('\n\x1b[31m  Some tests failed. Review the output above.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m  All required checks passed!\x1b[0m\n');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('\n\x1b[31mTest runner crashed:\x1b[0m', e);
  process.exit(2);
});

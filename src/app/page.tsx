import Link from 'next/link';
import { siteConfig } from '@/config/site.config';
import { PLANS } from '@/config/plans.config';
import { isFeatureEnabled } from '@/lib/features/gate';
import { Navbar } from '@/components/layout/navbar';
import { WaitlistForm } from '@/components/waitlist-form';
import { BrandIcon } from '@/components/brand-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  CreditCard,
  LayoutDashboard,
  Key,
  Server,
  Mail,
  HardDrive,
  Database,
  Image,
  Zap,
  Check,
  ArrowRight,
  Code2,
  Globe,
  Lock,
  Palette,
  Terminal,
  Layers,
  Star,
  Bot,
  FileJson,
  GitBranch,
  Workflow,
  Brain,
  Sparkles,
  X,
  ChevronRight,
  Rocket,
} from 'lucide-react';

// ── Pain Points (arithmetic hours) ─────────────────────────────────

const painPoints = [
  { icon: Shield, task: 'Auth, OAuth & role-based access', hours: 8 },
  { icon: CreditCard, task: 'Payment integration & billing', hours: 6 },
  { icon: LayoutDashboard, task: 'Dashboard, sidebar & admin panel', hours: 8 },
  { icon: Key, task: 'API key management & rate limits', hours: 4 },
  { icon: Mail, task: 'Transactional email templates', hours: 3 },
  { icon: Server, task: 'Background jobs & cron scheduling', hours: 4 },
  { icon: Database, task: 'Database, Redis & caching layer', hours: 3 },
  { icon: HardDrive, task: 'File storage & uploads', hours: 2 },
  { icon: Image, task: 'SEO, OG images & metadata', hours: 2 },
];

const totalHours = painPoints.reduce((sum, p) => sum + p.hours, 0);

// ── Features ───────────────────────────────────────────────────────

const features = [
  {
    icon: Shield,
    title: 'Authentication & Authorization',
    description:
      'Google OAuth with NextAuth v5. JWT sessions, role-based access, admin auto-approval, and waitlist mode — all pre-configured.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CreditCard,
    title: 'Billing & Credit System',
    description:
      'Dodo Payments subscriptions, one-time top-ups, webhook handling, and a full credit-based usage system with transaction history.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard & Admin Panel',
    description:
      'Responsive sidebar, dark mode, mobile navigation, user management admin panel, and settings pages — ready to extend.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Key,
    title: 'API Keys & MCP Protocol',
    description:
      'Full API key lifecycle with per-key tool permissions. Built-in Model Context Protocol (MCP) endpoint with rate limiting per plan.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Server,
    title: 'Background Services',
    description:
      'Modular service registry with cron scheduling, distributed Redis locks, and automatic run tracking in MongoDB.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Mail,
    title: 'Email & Notifications',
    description:
      'Beautiful transactional email templates via Resend. In-app notification system with preference management.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: HardDrive,
    title: 'File Storage',
    description:
      'Cloudflare R2 / S3-compatible uploads with presigned URLs, content-type detection, and organized key generation.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Database,
    title: 'Redis Caching Layer',
    description:
      'Connection pooling, TTL management, cache-aside pattern, rate limiting, and distributed locking — all pre-wired.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
  {
    icon: Image,
    title: 'Dynamic OG Images',
    description:
      'Auto-generated Open Graph images with Satori. Customizable templates, edge-cached, SEO-ready out of the box.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
];

// ── Build vs Buy Comparison ────────────────────────────────────────

const comparison = [
  { component: 'Auth + OAuth + RBAC', diy: '8–12 hrs' },
  { component: 'Payment & Subscriptions', diy: '6–10 hrs' },
  { component: 'Dashboard + Admin Panel', diy: '8–12 hrs' },
  { component: 'API Keys + Rate Limiting', diy: '4–6 hrs' },
  { component: 'Email Templates & Notifications', diy: '3–5 hrs' },
  { component: 'Background Services & Cron', diy: '4–8 hrs' },
  { component: 'File Storage (S3/R2)', diy: '2–4 hrs' },
  { component: 'Redis + Caching + Locking', diy: '3–5 hrs' },
  { component: 'MCP Protocol Endpoint', diy: '8–12 hrs' },
  { component: 'OG Images + SEO + Sitemap', diy: '2–4 hrs' },
];

// ── AI Section ─────────────────────────────────────────────────────

const aiReasons = [
  {
    icon: FileJson,
    title: 'MCP Protocol Built-In',
    description:
      'Native Model Context Protocol endpoint so AI agents can interact with your app through a standardized interface.',
  },
  {
    icon: Workflow,
    title: 'Modular Service Architecture',
    description:
      'Clean separation of concerns with typed interfaces. AI coding assistants can understand and extend each module independently.',
  },
  {
    icon: Brain,
    title: 'Type-Safe Throughout',
    description:
      'Full TypeScript coverage with strict mode. AI tools generate better code when they have strong type context.',
  },
  {
    icon: Layers,
    title: 'Convention Over Configuration',
    description:
      'Predictable file structure, consistent patterns, and centralized config. AI assistants navigate and modify code confidently.',
  },
];

// ── Tech Stack ─────────────────────────────────────────────────────

const techStack = [
  { name: 'Next.js 16', icon: Globe },
  { name: 'React 19', icon: Code2 },
  { name: 'TypeScript', icon: Terminal },
  { name: 'Tailwind CSS 4', icon: Palette },
  { name: 'MongoDB', icon: Database },
  { name: 'Redis', icon: Zap },
  { name: 'NextAuth v5', icon: Lock },
  { name: 'shadcn/ui', icon: Layers },
];

// ── FAQ ────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "What's included in the template?",
    answer:
      'Everything you need to launch a production SaaS: authentication (Google OAuth), payment processing, dashboard with sidebar navigation, API key management, credit system, background job processing, email templates, file storage, MCP protocol endpoint, admin panel, and 80+ pre-built UI components.',
  },
  {
    question: 'What tech stack does it use?',
    answer:
      'Next.js 16 with App Router, React 19, TypeScript (strict mode), Tailwind CSS 4, MongoDB with Mongoose, Redis for caching and rate limiting, NextAuth v5 for authentication, and shadcn/ui for components.',
  },
  {
    question: 'Is this open source?',
    answer:
      'Yes! The template is fully open-source. Clone it, modify it, and use it for any project — personal or commercial. No attribution required.',
  },
  {
    question: 'How customizable is it?',
    answer:
      'Highly customizable. A single site.config.ts file controls your branding, features, and settings. Toggle features on/off, change colors, update your logo — everything adapts automatically across the entire app.',
  },
  {
    question: 'Does it work with AI coding tools?',
    answer:
      'Absolutely. The codebase is designed with AI-first architecture: full TypeScript coverage, consistent patterns, clear separation of concerns, and predictable file structure. Tools like Claude Code, Cursor, and GitHub Copilot can understand and extend it effectively.',
  },
  {
    question: 'Can I use it for commercial projects?',
    answer:
      'Yes. There are no restrictions on commercial use. Build your SaaS, charge customers, and keep 100% of the revenue.',
  },
  {
    question: 'How do I get started?',
    answer:
      "Clone the repo, copy .env.example to .env, fill in your database URI and OAuth credentials, run npm install, and start the dev server. Customize site.config.ts to match your brand and toggle features on or off. You'll be up and running in under 5 minutes.",
  },
  {
    question: 'Do I need MongoDB and Redis?',
    answer:
      'MongoDB is required for the database layer. Redis is used for caching, rate limiting, and distributed locks but the app works without it — features gracefully degrade. For production, we recommend both.',
  },
];

// ── Config Preview ─────────────────────────────────────────────────

const codeSnippet = `// site.config.ts — one file, entire brand
export const siteConfig = {
  name: '${siteConfig.name}',
  brandIcon: { type: 'lucide', name: 'Rocket' },
  features: {
    billing: true,
    credits: true,
    mcp: true,
    apiKeys: true,
    // toggle anything on/off
  },
};`;

// ── Pricing ────────────────────────────────────────────────────────

const plansList = Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan }));

// ── Page ───────────────────────────────────────────────────────────

export default async function LandingPage() {
  const authEnabled = isFeatureEnabled('auth');
  const waitlistEnabled = siteConfig.features.waitlist;

  // Only check session when auth is enabled to avoid DB calls when auth is off
  let isLoggedIn = false;
  if (authEnabled) {
    try {
      const { auth } = await import('@/lib/auth/auth');
      const session = await auth();
      isLoggedIn = !!session?.user;
    } catch {
      // Auth check failed (DB down, etc.) — treat as logged out
    }
  }

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Compare', href: '#comparison' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ──────────────────────────────────────── */}
      <Navbar links={navLinks} isLoggedIn={isLoggedIn} />

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
          <Badge variant="secondary" className="mb-5 px-3 py-1 text-xs font-medium">
            <Sparkles className="mr-1.5 h-3 w-3 text-primary" />
            Open-source &middot; AI-friendly &middot; Production-ready
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Ship your SaaS in days,
            <span className="block text-primary mt-1">not months.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The production-ready Next.js template with auth, payments, API keys, MCP, and everything
            you need. Stop rebuilding infrastructure — focus on what makes your product unique.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {authEnabled ? (
              <Button size="lg" className="w-full sm:w-auto px-8" asChild>
                <Link href={isLoggedIn ? '/dashboard' : '/login'}>
                  {isLoggedIn ? 'Go to Dashboard' : 'Start Building Free'}{' '}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : waitlistEnabled ? null : (
              siteConfig.socials.github && (
                <Button size="lg" className="w-full sm:w-auto px-8" asChild>
                  <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
                    <GitBranch className="mr-2 h-4 w-4" /> Get Started on GitHub
                  </a>
                </Button>
              )
            )}
            {authEnabled && siteConfig.socials.github && (
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8" asChild>
                <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
                  <GitBranch className="mr-2 h-4 w-4" /> View on GitHub
                </a>
              </Button>
            )}
          </div>

          {/* Waitlist form */}
          {waitlistEnabled && (
            <div id="waitlist" className="mt-8 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Be the first to know when we launch.
              </p>
              <WaitlistForm />
            </div>
          )}
        </div>

        {/* Tech stack trust bar */}
        <div className="max-w-3xl mx-auto px-4 pb-16 sm:pb-20">
          <p className="text-center text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wider">
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {techStack.map((tech) => (
              <div key={tech.name} className="flex items-center gap-1.5 text-muted-foreground">
                <tech.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Problem / Pain Points ───────────────────────── */}
      <section id="problem" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              The Problem
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Every SaaS starts with the same
              <span className="text-destructive"> {totalHours}+ hours</span> of plumbing
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Before you write a single line of product code, you&apos;re stuck building the same
              infrastructure everyone else builds.
            </p>
          </div>

          {/* Arithmetic breakdown */}
          <div className="max-w-2xl mx-auto space-y-2 mb-8">
            {painPoints.map((point) => (
              <div
                key={point.task}
                className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <X className="h-4 w-4 text-destructive shrink-0" />
                  <point.icon className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  <span className="text-sm">{point.task}</span>
                </div>
                <Badge variant="secondary" className="text-destructive font-mono text-xs shrink-0 ml-2">
                  ~{point.hours} hrs
                </Badge>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 font-semibold">
              <span className="text-sm">Total before writing product code</span>
              <Badge variant="destructive" className="font-mono">
                {totalHours}+ hrs
              </Badge>
            </div>
          </div>

          {/* Solution contrast */}
          <Card className="border-primary/30 bg-primary/5 max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <Rocket className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">What if it was already done?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                {siteConfig.name} gives you a complete, production-tested foundation. Clone it,
                configure one file, and start building your unique features in minutes.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium">
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" /> Save {totalHours}+ hours
                </div>
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" /> Ship this week
                </div>
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" /> Production-ready
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ── Config Preview ──────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                One-File Setup
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Configure once,
                <span className="text-primary"> brand everywhere</span>
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                A single config file controls your name, logo, features, and branding. Every page,
                email template, and API endpoint reads from it — zero copy-paste, zero drift.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Swap your logo with one line change',
                  'Toggle features like billing, MCP, admin panel',
                  'All emails, OG images, and UI adapt automatically',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">site.config.ts</span>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono leading-relaxed text-foreground overflow-x-auto">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Features Grid ───────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4">
              What&apos;s Included
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              9 production systems, ready to go
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each module is built, tested, and documented. Use what you need, disable what you
              don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-md transition-all duration-200 hover:border-primary/20"
              >
                <CardHeader className="pb-2">
                  <div
                    className={`w-9 h-9 rounded-lg ${feature.bg} flex items-center justify-center mb-2`}
                  >
                    <feature.icon className={`h-4.5 w-4.5 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Build vs Buy Comparison ─────────────────────── */}
      <section id="comparison" className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4">
              Build vs. Buy
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              50–80 hours of work, or <span className="text-primary">5 minutes</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every component is built, tested, and integrated. Here&apos;s what you&apos;d spend
              building each one from scratch.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-3 bg-muted/50 px-4 sm:px-6 py-3 text-sm font-medium border-b border-border">
                <span>Component</span>
                <span className="text-center px-2">From Scratch</span>
                <span className="text-center px-2">With {siteConfig.name}</span>
              </div>
              {/* Rows */}
              {comparison.map((row, i) => (
                <div
                  key={row.component}
                  className={`grid grid-cols-[1fr_auto_auto] sm:grid-cols-3 px-4 sm:px-6 py-3 text-sm items-center ${
                    i % 2 === 0 ? '' : 'bg-muted/20'
                  } ${i < comparison.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <span className="font-medium text-xs sm:text-sm">{row.component}</span>
                  <span className="text-center text-destructive font-mono text-xs px-2">
                    {row.diy}
                  </span>
                  <span className="text-center px-2">
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-xs">
                      <Check className="h-3.5 w-3.5" /> Ready
                    </span>
                  </span>
                </div>
              ))}
              {/* Total */}
              <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-3 px-4 sm:px-6 py-3.5 text-sm font-bold border-t-2 border-border bg-muted/40">
                <span>Total</span>
                <span className="text-center text-destructive px-2">50–80 hrs</span>
                <span className="text-center text-primary px-2">~5 min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── AI-Friendly Architecture ────────────────────── */}
      <section id="ai" className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4">
              <Bot className="mr-1.5 h-3 w-3" /> AI-Friendly Architecture
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Built for humans <span className="text-primary">&amp; AI agents</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              The codebase is structured so AI coding assistants (Cursor, Claude Code, Copilot) can
              understand, navigate, and extend it effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {aiReasons.map((reason) => (
              <Card key={reason.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <reason.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{reason.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {reason.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── How It Works ────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4">
              3 Steps
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              From clone to production in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Clone & Configure',
                description:
                  'Clone the repo, copy .env.example, fill in your MongoDB URI, Redis URL, and OAuth credentials.',
                code: 'git clone && cp .env.example .env',
              },
              {
                step: '2',
                title: 'Customize',
                description:
                  'Edit site.config.ts with your brand name and logo. Toggle features on or off. Add your routes.',
                code: 'name: "YourApp"',
              },
              {
                step: '3',
                title: 'Deploy',
                description:
                  'Push to Vercel, Railway, or any Docker host. The standalone build and Dockerfile are included.',
                code: 'npm run build && npm start',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {item.description}
                </p>
                <code className="text-xs bg-muted px-2.5 py-1 rounded-md font-mono text-muted-foreground">
                  {item.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4">
              <CreditCard className="mr-1.5 h-3 w-3" /> Built-In Billing
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Pricing plans, <span className="text-primary">ready to use</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pre-configured subscription tiers with Dodo Payments integration.
              Customize plans, prices, and features in a single config file.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {plansList.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-0.5 text-xs">
                      <Star className="mr-1 h-3 w-3" /> Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                </CardHeader>
                <CardContent className="pt-3">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {authEnabled && (
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      className="w-full mt-5"
                      size="sm"
                      asChild
                    >
                      <Link href="/login">
                        {plan.price === 0 ? 'Get Started Free' : 'Start Building'}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            These are example plans from <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">plans.config.ts</code>. Customize
            names, prices, and features to match your product.
          </p>
        </div>
      </section>

      <Separator />

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know about {siteConfig.name}.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={`faq-${i}`} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Separator />

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary px-6 py-12 sm:px-12 sm:py-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent)]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">
                Your competitors are shipping. Are you?
              </h2>
              <p className="mt-3 text-primary-foreground/80 max-w-md mx-auto text-sm sm:text-base">
                Every day without launching is revenue left on the table. Clone {siteConfig.name},
                configure it in minutes, and ship your SaaS this week.
              </p>
              {authEnabled ? (
                <Button size="lg" variant="secondary" className="mt-6 px-8" asChild>
                  <Link href={isLoggedIn ? '/dashboard' : '/login'}>
                    Start Building Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : waitlistEnabled ? (
                <div className="mt-6">
                  <WaitlistForm />
                </div>
              ) : siteConfig.socials.github ? (
                <Button size="lg" variant="secondary" className="mt-6 px-8" asChild>
                  <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
                    View on GitHub <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BrandIcon withBackground size={14} bgClassName="w-6 h-6" />
              <span className="font-semibold text-sm">{siteConfig.name}</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {siteConfig.name}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

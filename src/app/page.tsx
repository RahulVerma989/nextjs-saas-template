import Link from 'next/link';
import { siteConfig } from '@/config/site.config';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">{siteConfig.name[0]}</span>
              </div>
              <span className="text-xl font-bold">{siteConfig.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto">
            {siteConfig.description}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with Next.js, MongoDB, Redis, and all the tools you need to launch your SaaS product. Auth, billing, API keys, MCP integration, and more \u2014 all ready to go.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-base font-medium hover:opacity-90 transition-opacity">
              Start Building
            </Link>
            <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer" className="border border-border px-8 py-3 rounded-lg text-base font-medium hover:bg-muted transition-colors">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Authentication', desc: 'Google OAuth with NextAuth v5, JWT sessions, role-based access control' },
              { title: 'Billing & Payments', desc: 'Dodo Payments integration with subscriptions, credit system, and webhook handling' },
              { title: 'Dashboard', desc: 'Responsive dashboard with collapsible sidebar, dark mode, and admin panel' },
              { title: 'API Keys & MCP', desc: 'API key management and Model Context Protocol integration framework' },
              { title: 'Background Services', desc: 'Modular service registry with scheduling, distributed locks, and MongoDB tracking' },
              { title: 'Email & Notifications', desc: 'Transactional emails via Resend and in-app notification system' },
              { title: 'File Storage', desc: 'S3/R2 compatible file uploads with presigned URLs' },
              { title: 'Caching', desc: 'Redis caching layer with rate limiting and cache-aside pattern' },
              { title: 'OG Images', desc: 'Dynamic Open Graph image generation with Satori' },
            ].map((feature) => (
              <div key={feature.title} className="bg-background rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

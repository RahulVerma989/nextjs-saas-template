import Link from 'next/link';
import { siteConfig } from '@/config/site.config';
import { BrandIcon } from '@/components/brand-icon';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  /** Middle navigation links (anchor links on landing, page links on legal) */
  links?: NavLink[];
  /** Whether the user is logged in — controls CTA text & destination */
  isLoggedIn?: boolean;
}

export function Navbar({ links, isLoggedIn }: NavbarProps) {
  const authEnabled = siteConfig.features.auth;
  const waitlistEnabled = siteConfig.features.waitlist;

  // Determine CTA
  let ctaHref: string | null = null;
  let ctaLabel = '';

  if (authEnabled) {
    ctaHref = isLoggedIn ? '/dashboard' : '/login';
    ctaLabel = isLoggedIn ? 'Dashboard' : 'Get Started';
  } else if (waitlistEnabled) {
    ctaHref = '#waitlist';
    ctaLabel = 'Join Waitlist';
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <BrandIcon withBackground size={16} bgClassName="w-7 h-7" />
            <span className="text-base font-bold tracking-tight">{siteConfig.name}</span>
          </Link>

          {/* Middle links */}
          {links && links.length > 0 && (
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Right side: theme toggle + CTA */}
          <div className="flex items-center gap-2">
            {siteConfig.features.darkMode && <ThemeToggle />}
            {ctaHref && (
              <Button size="sm" asChild>
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

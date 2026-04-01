'use client';

import { MobileSidebar } from './mobile-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { siteConfig } from '@/config/site.config';

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <MobileSidebar />
      {siteConfig.features.darkMode && <ThemeToggle />}
    </header>
  );
}

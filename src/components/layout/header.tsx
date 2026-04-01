'use client';

import { MobileSidebar } from './mobile-sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-10 shrink-0 items-center border-b border-border bg-background px-4 lg:hidden">
      <MobileSidebar />
    </header>
  );
}

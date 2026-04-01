'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { siteConfig } from '@/config/site.config';
import { navigationSections, isNavItemActive } from '@/config/navigation';
import { cn } from '@/lib/utils/cn';
import { Menu, X, LogOut } from 'lucide-react';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-1 -ml-1 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">{siteConfig.name[0]}</span>
                </div>
                <span className="text-lg font-bold">{siteConfig.name}</span>
              </Link>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>

            <nav className="flex flex-col justify-between flex-1">
              <div className="space-y-4">
                {navigationSections.map((section) => (
                  <div key={section.label}>
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{section.label}</div>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = isNavItemActive(pathname, item);
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent',
                                'flex items-center gap-x-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors'
                              )}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t border-sidebar-border pt-4 mt-4">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-x-3 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Log out
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

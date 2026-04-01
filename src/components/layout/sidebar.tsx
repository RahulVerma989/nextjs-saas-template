'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';
import { siteConfig } from '@/config/site.config';
import { navigationSections, adminNavigation, isNavItemActive } from '@/config/navigation';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/context/theme-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Moon, PanelLeft, PanelLeftClose, Sun, Zap } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles?.includes('admin');
  const { collapsed, toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const user = session?.user;
  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div
      className={cn(
        'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'lg:w-14' : 'lg:w-60'
      )}
    >
      <div className="flex grow flex-col overflow-y-auto overflow-x-hidden border-r border-sidebar-border bg-sidebar">
        {/* Header */}
        <div className={cn('flex h-14 shrink-0 items-center', collapsed ? 'px-2 justify-center' : 'px-4')}>
          {collapsed ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={toggle} className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer">
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Expand sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">{siteConfig.name[0]}</span>
                </div>
                <span className="text-lg font-bold text-foreground">{siteConfig.name}</span>
              </Link>
              <button onClick={toggle} className="flex items-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer">
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <nav className={cn('flex flex-1 flex-col', collapsed ? '' : 'px-4')}>
          <ul role="list" className="flex flex-1 flex-col gap-y-4">
            {navigationSections.map((section) => (
              <li key={section.label}>
                {!collapsed && (
                  <div className="text-[11px] font-medium leading-4 text-muted-foreground uppercase tracking-wide mb-1.5">
                    {section.label}
                  </div>
                )}
                <ul role="list" className={cn('space-y-0.5', collapsed ? 'px-2' : '-mx-2')}>
                  {section.items.map((item) => {
                    const isActive = isNavItemActive(pathname, item);

                    if (collapsed) {
                      return (
                        <li key={item.name}>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={item.href}
                                  className={cn(
                                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
                                    'flex items-center justify-center rounded-md p-2 transition-colors'
                                  )}
                                >
                                  <item.icon className={cn(isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground', 'h-4 w-4 shrink-0')} />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </li>
                      );
                    }

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
                            'group flex items-center gap-x-3 rounded-md px-2 py-1.5 text-[13px] leading-5 font-medium transition-colors'
                          )}
                        >
                          <item.icon className={cn(isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground', 'h-4 w-4 shrink-0')} />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}

            {isAdmin && (
              <li>
                {!collapsed && (
                  <div className="text-[11px] font-medium leading-4 text-warning uppercase tracking-wide mb-1.5">Admin</div>
                )}
                <ul role="list" className={cn('space-y-0.5', collapsed ? 'px-2' : '-mx-2')}>
                  {adminNavigation.map((item) => {
                    const isActive = isNavItemActive(pathname, item);
                    if (collapsed) {
                      return (
                        <li key={item.name}>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={item.href} className={cn(isActive ? 'bg-warning/10 text-warning' : 'text-sidebar-foreground hover:text-warning hover:bg-warning/10', 'flex items-center justify-center rounded-md p-2 transition-colors')}>
                                  <item.icon className={cn(isActive ? 'text-warning' : 'text-muted-foreground', 'h-4 w-4 shrink-0')} />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </li>
                      );
                    }
                    return (
                      <li key={item.name}>
                        <Link href={item.href} className={cn(isActive ? 'bg-warning/10 text-warning' : 'text-sidebar-foreground hover:text-warning hover:bg-warning/10', 'group flex items-center gap-x-3 rounded-md px-2 py-1.5 text-[13px] leading-5 font-medium transition-colors')}>
                          <item.icon className={cn(isActive ? 'text-warning' : 'text-muted-foreground group-hover:text-warning', 'h-4 w-4 shrink-0')} />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}
          </ul>
        </nav>

        {/* User section at bottom */}
        {user && (
          <div className={cn('shrink-0 border-t border-sidebar-border pt-3 mt-2', collapsed ? 'px-2 pb-3' : 'px-3 pb-3')}>
            {/* Credits */}
            {!collapsed ? (
              <Link href="/dashboard/billing" className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-md hover:bg-sidebar-accent transition-colors">
                <Zap className="w-3 h-3 text-warning" />
                <span className="text-xs font-medium text-sidebar-foreground">{user.creditBalance ?? 0} credits</span>
              </Link>
            ) : (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/dashboard/billing" className="flex items-center justify-center py-1 mb-2 rounded-md hover:bg-sidebar-accent transition-colors">
                      <Zap className="w-3.5 h-3.5 text-warning" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{user.creditBalance ?? 0} credits</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Theme toggle */}
            {collapsed ? (
              <button onClick={toggleTheme} className="flex items-center justify-center w-full rounded-md p-2 mb-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer">
                {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              </button>
            ) : (
              <button onClick={toggleTheme} className="flex items-center gap-x-3 w-full px-2 py-1.5 mb-2 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer">
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                <span className="text-[13px] font-medium text-sidebar-foreground">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
            )}

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn('flex items-center w-full rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer text-left', collapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2 py-2')}>
                  <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                    <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                    <AvatarFallback className="text-[11px] font-medium bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate leading-tight">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{user.email}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align={collapsed ? 'center' : 'start'} side="top" sideOffset={8}>
                <div className="px-3 py-2.5 border-b border-border mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing" className="cursor-pointer">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => signOut({ callbackUrl: '/' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Dashboard navigation configuration.
 *
 * Add or remove items here — the sidebar and mobile nav
 * read from this array. Items are conditionally shown based
 * on `siteConfig.features`.
 */

import {
  LayoutDashboard,
  CreditCard,
  Settings,
  Plug,
  Shield,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { siteConfig } from './site.config';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

function buildNavigationSections(): NavSection[] {
  const mainItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
  ];

  if (siteConfig.features.billing) {
    mainItems.push({
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
    });
  }

  if (siteConfig.features.apiKeys) {
    mainItems.push({
      name: 'Integrations',
      href: '/dashboard/integrations',
      icon: Plug,
    });
  }

  mainItems.push({
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  });

  return [{ label: 'Main', items: mainItems }];
}

function buildAdminNavigation(): NavItem[] {
  if (!siteConfig.features.adminPanel) return [];

  return [
    {
      name: 'Admin',
      href: '/dashboard/admin',
      icon: Shield,
    },
  ];
}

export const navigationSections = buildNavigationSections();
export const adminNavigation = buildAdminNavigation();

export const NOTIFICATION_ICON = Bell;

/** Check if a nav item is active for the current pathname */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname.startsWith(item.href);
}

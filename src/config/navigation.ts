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
  Search,
  Users,
  ListChecks,
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
  const items: NavItem[] = [];

  if (siteConfig.features.adminPanel) {
    items.push(
      {
        name: 'Overview',
        href: '/dashboard/admin',
        icon: Shield,
      },
      {
        name: 'Users',
        href: '/dashboard/admin/users',
        icon: Users,
      },
    );
  }

  // SEO + page-indexing — admin-only, only when GSC indexing is
  // enabled.  SEO is the connection / verification page; Page Indexing
  // is the per-route status table.
  if (siteConfig.features.gscIndexing) {
    items.push(
      {
        name: 'SEO',
        href: '/dashboard/settings/seo',
        icon: Search,
      },
      {
        name: 'Page Indexing',
        href: '/dashboard/admin/page-indexing',
        icon: ListChecks,
      },
    );
  }

  return items;
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

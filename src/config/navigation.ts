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
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only show if the user has one of these roles */
  roles?: string[];
}

function buildNavItems(): NavItem[] {
  const items: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
  ];

  if (siteConfig.features.billing) {
    items.push({
      label: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
    });
  }

  if (siteConfig.features.apiKeys) {
    items.push({
      label: 'Integrations',
      href: '/dashboard/integrations',
      icon: Plug,
    });
  }

  items.push({
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  });

  if (siteConfig.features.adminPanel) {
    items.push({
      label: 'Admin',
      href: '/dashboard/admin',
      icon: Shield,
      roles: ['admin'],
    });
  }

  return items;
}

export const NAV_ITEMS = buildNavItems();

export const NOTIFICATION_ICON = Bell;

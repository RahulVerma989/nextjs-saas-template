import crypto from 'crypto';
import { siteConfig } from '@/config/site.config';
import type { OGImageData } from './types';

export function generateDataHash(data: OGImageData): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('md5').update(normalized).digest('hex');
}

const STATIC_PAGES: Record<string, OGImageData> = {
  '': {
    type: 'home',
    title: siteConfig.name,
    description: siteConfig.description,
    primaryColor: siteConfig.theme.primaryColor,
  },
  home: {
    type: 'home',
    title: siteConfig.name,
    description: siteConfig.description,
    primaryColor: siteConfig.theme.primaryColor,
  },
  privacy: {
    type: 'privacy',
    title: 'Privacy Policy',
    description: `Learn how ${siteConfig.name} handles your data.`,
    primaryColor: siteConfig.theme.primaryColor,
  },
  terms: {
    type: 'terms',
    title: 'Terms of Service',
    description: `Terms and conditions for using ${siteConfig.name}.`,
    primaryColor: siteConfig.theme.primaryColor,
  },
  contact: {
    type: 'contact',
    title: 'Contact Us',
    description: `Get in touch with the ${siteConfig.name} team.`,
    primaryColor: siteConfig.theme.primaryColor,
  },
  about: {
    type: 'about',
    title: `About ${siteConfig.name}`,
    description: siteConfig.description,
    primaryColor: siteConfig.theme.primaryColor,
  },
  login: {
    type: 'login',
    title: `Sign in to ${siteConfig.name}`,
    description: `Log in to your ${siteConfig.name} account.`,
    primaryColor: siteConfig.theme.primaryColor,
  },
};

export function getStaticPageData(slug: string): OGImageData | null {
  return STATIC_PAGES[slug] || null;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function cleanText(text: string, maxLength: number = 200): string {
  const stripped = text.replace(/<[^>]*>/g, '');
  const normalized = stripped.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const truncated = normalized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated.substring(0, maxLength - 3) + '...';
}

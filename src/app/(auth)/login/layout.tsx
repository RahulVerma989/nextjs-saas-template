import { siteConfig } from '@/config/site.config';
import { requireFeature } from '@/lib/features/gate';

export const metadata = {
  title: 'Sign In',
  description: `Sign in to your ${siteConfig.name} account.`,
  openGraph: {
    title: `Sign In | ${siteConfig.name}`,
    description: `Sign in to your ${siteConfig.name} account.`,
    images: [{ url: '/api/og?slug=login', width: 1200, height: 630 }],
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  requireFeature('auth');
  return children;
}

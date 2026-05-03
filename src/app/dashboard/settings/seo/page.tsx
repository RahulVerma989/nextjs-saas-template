import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { siteConfig } from '@/config/site.config';
import { connectDB } from '@/lib/db/connection';
import { getConnection } from '@/lib/services/gsc.service';
import { PageIndex } from '@/lib/db/models';
import { GSCSettingsClient } from './client';

export const dynamic = 'force-dynamic';

/**
 * Admin-only SEO settings page.  Lets the deployment owner connect
 * a Google Search Console property so the page-indexing job can
 * auto-submit changed marketing pages to Google's Indexing API.
 *
 * Per-user isn't useful here — there's only one site to index, so
 * we store one site-wide connection and gate the UI on `roles=admin`.
 */
export default async function SEOSettingsPage() {
  if (!siteConfig.features.gscIndexing) {
    redirect('/dashboard/settings');
  }

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const isAdmin =
    siteConfig.adminEmails.includes((session.user.email ?? '').toLowerCase()) ||
    (session.user as { roles?: string[] }).roles?.includes('admin');
  if (!isAdmin) redirect('/dashboard/settings');

  await connectDB();
  const conn = await getConnection();
  const [submitted, indexed, notIndexed, errored, total] = await Promise.all([
    PageIndex.countDocuments({ status: 'submitted' }),
    PageIndex.countDocuments({ status: 'indexed' }),
    PageIndex.countDocuments({ status: 'not_indexed' }),
    PageIndex.countDocuments({ status: 'error' }),
    PageIndex.countDocuments({}),
  ]);

  return (
    <GSCSettingsClient
      connected={!!conn}
      siteUrl={conn?.siteUrl ?? null}
      connectedAt={conn?.connectedAt ? new Date(conn.connectedAt).toISOString() : null}
      lastUsedAt={conn?.lastUsedAt ? new Date(conn.lastUsedAt).toISOString() : null}
      lastError={conn?.lastError ?? null}
      stats={{ submitted, indexed, notIndexed, errored, total }}
    />
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { siteConfig } from '@/config/site.config';
import { connectDB } from '@/lib/db/connection';
import { getConnection } from '@/lib/services/gsc.service';
import { PageIndex } from '@/lib/db/models';
import { isDemoMode, isOwnerEmail } from '@/lib/auth/demo';
import { PageIndexingClient } from './client';

export const dynamic = 'force-dynamic';

/**
 * Page Indexing — admin dashboard for the GSC page-indexing job.
 *
 * Lives separately from the SEO settings page so the connection /
 * verification UI stays focused.  Shows submission stats, every
 * tracked route's coverage state, and a manual sync trigger.
 */
export default async function PageIndexingAdminPage() {
  if (!siteConfig.features.gscIndexing) {
    redirect('/dashboard');
  }

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const isAdmin =
    siteConfig.adminEmails.includes((session.user.email ?? '').toLowerCase()) ||
    (session.user as { roles?: string[] }).roles?.includes('admin');
  if (!isAdmin) redirect('/dashboard');

  await connectDB();
  const conn = await getConnection();

  const [submitted, indexed, notIndexed, errored, pending, total, pages] =
    await Promise.all([
      PageIndex.countDocuments({ status: 'submitted' }),
      PageIndex.countDocuments({ status: 'indexed' }),
      PageIndex.countDocuments({ status: 'not_indexed' }),
      PageIndex.countDocuments({ status: 'error' }),
      PageIndex.countDocuments({ status: 'pending' }),
      PageIndex.countDocuments({}),
      PageIndex.find({})
        .sort({ updatedAt: -1 })
        .limit(500)
        .lean(),
    ]);

  return (
    <PageIndexingClient
      connected={!!conn}
      verified={!!conn?.verified}
      siteUrl={conn?.siteUrl ?? null}
      stats={{ submitted, indexed, notIndexed, errored, pending, total }}
      readOnly={isDemoMode() && !isOwnerEmail(session.user.email)}
      pages={pages.map((p) => ({
        path: p._id,
        status: p.status,
        coverageState: p.coverageState ?? null,
        submittedAt: p.submittedAt
          ? new Date(p.submittedAt).toISOString()
          : null,
        inspectedAt: p.inspectedAt
          ? new Date(p.inspectedAt).toISOString()
          : null,
        lastError: p.lastError ?? null,
      }))}
    />
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { siteConfig } from '@/config/site.config';
import { connectDB } from '@/lib/db/connection';
import {
  getConnection,
  getTargetHost,
  refreshVerificationStatus,
} from '@/lib/services/gsc.service';
import { isDemoMode, isOwnerEmail } from '@/lib/auth/demo';
import { GSCSettingsClient } from './client';

export const dynamic = 'force-dynamic';

/**
 * Admin-only SEO settings page.  Lets the deployment owner connect a
 * Google Search Console property, verify ownership, and switch the
 * active property.  Per-page indexing stats live on a separate admin
 * page (`/dashboard/admin/page-indexing`).
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
  // Refresh verification status on every render so the UI flips to
  // "verified" the moment Google approves the proof — no manual reload.
  const conn = (await refreshVerificationStatus()) ?? (await getConnection());

  return (
    <GSCSettingsClient
      connected={!!conn}
      siteUrl={conn?.siteUrl ?? null}
      targetHost={getTargetHost()}
      connectedAt={conn?.connectedAt ? new Date(conn.connectedAt).toISOString() : null}
      lastUsedAt={conn?.lastUsedAt ? new Date(conn.lastUsedAt).toISOString() : null}
      lastError={conn?.lastError ?? null}
      verified={!!conn?.verified}
      verification={{
        method: conn?.verificationMethod ?? null,
        metaToken: conn?.verificationMetaToken ?? null,
        fileName: conn?.verificationFileName ?? null,
        fileContent: conn?.verificationFileContent ?? null,
        dnsRecord: conn?.verificationDnsRecord ?? null,
      }}
      readOnly={isDemoMode() && !isOwnerEmail(session.user.email)}
    />
  );
}

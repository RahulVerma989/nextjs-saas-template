import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { siteConfig } from '@/config/site.config';
import { connectDB } from '@/lib/db/connection';
import { PageIndex } from '@/lib/db/models';
import { getConnection, disconnect } from '@/lib/services/gsc.service';

/**
 * GET  → status (connected? which site? counts of submitted/indexed pages)
 * DELETE → disconnect (removes the singleton doc; pages stay so we can
 *          resume on reconnect without resubmitting everything).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const isAdmin =
    siteConfig.adminEmails.includes((session.user.email ?? '').toLowerCase()) ||
    (session.user as { roles?: string[] }).roles?.includes('admin');
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }

  await connectDB();
  const conn = await getConnection();
  if (!conn) {
    return NextResponse.json({
      success: true,
      data: { connected: false },
    });
  }

  // Quick stats so the settings page can show progress at a glance.
  const [submitted, indexed, errored] = await Promise.all([
    PageIndex.countDocuments({ status: 'submitted' }),
    PageIndex.countDocuments({ status: 'indexed' }),
    PageIndex.countDocuments({ status: 'error' }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      connected: true,
      siteUrl: conn.siteUrl,
      connectedAt: conn.connectedAt,
      lastUsedAt: conn.lastUsedAt ?? null,
      lastError: conn.lastError ?? null,
      stats: { submitted, indexed, errored },
    },
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const isAdmin =
    siteConfig.adminEmails.includes((session.user.email ?? '').toLowerCase()) ||
    (session.user as { roles?: string[] }).roles?.includes('admin');
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }

  await disconnect();
  return NextResponse.json({ success: true });
}

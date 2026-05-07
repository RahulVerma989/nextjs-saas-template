import { NextResponse } from 'next/server';
import { requireAdminWriteApi } from '@/lib/auth/admin-guard';
import { runPageSync } from '@/lib/services/page-indexing.service';

/**
 * POST /api/integrations/gsc/sync
 *
 * Manually trigger the page-indexing reconciliation.  Same logic as
 * the recurring agenda job — admins use this from the SEO settings
 * page to push changes immediately instead of waiting 30 minutes.
 *
 * Demo-mode-aware: blocked because it talks to Google's quota.
 */
export async function POST() {
  const adminCheck = await requireAdminWriteApi();
  if (adminCheck.response) return adminCheck.response;

  try {
    const result = await runPageSync();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Sync failed',
      },
      { status: 500 },
    );
  }
}

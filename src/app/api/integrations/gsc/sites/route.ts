import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, requireAdminWriteApi } from '@/lib/auth/admin-guard';
import { listSites, setActiveSite } from '@/lib/services/gsc.service';

/**
 * GET  /api/integrations/gsc/sites — list every property the
 *      connected Google account has access to (verified or not).
 *      Used by the settings UI to populate the property switcher.
 *
 * PATCH /api/integrations/gsc/sites — switch the active property.
 *      Body: { siteUrl: string }.  Validated server-side; the
 *      target must be verified or we 400.
 */
export async function GET() {
  const adminCheck = await requireAdminApi();
  if (adminCheck.response) return adminCheck.response;

  try {
    const sites = await listSites();
    return NextResponse.json({ success: true, data: { sites } });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to list sites',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const adminCheck = await requireAdminWriteApi();
  if (adminCheck.response) return adminCheck.response;

  try {
    const { siteUrl } = await req.json();
    if (!siteUrl || typeof siteUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'siteUrl is required' },
        { status: 400 },
      );
    }
    const conn = await setActiveSite(siteUrl);
    return NextResponse.json({ success: true, data: { siteUrl: conn.siteUrl } });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to switch site',
      },
      { status: 400 },
    );
  }
}

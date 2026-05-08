import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin-guard';
import { connectDB } from '@/lib/db/connection';
import { getUserCrud } from '@/lib/db/crud/user.crud';
import { shouldMaskPiiFor, maskEmail } from '@/lib/auth/demo';

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.response) return adminCheck.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';

    await connectDB();
    const userCrud = getUserCrud();
    const result = await userCrud.listUsers({ page, limit, search });

    // In demo mode, mask emails for non-owner viewers so the admin UI
    // doesn't leak real user emails to drive-by visitors.  The owner
    // (whose email is on `siteConfig.adminEmails`) still sees real
    // data so they can actually operate the system.
    const viewerEmail = adminCheck.session?.user?.email ?? null;
    if (shouldMaskPiiFor(viewerEmail) && Array.isArray(result?.users)) {
      result.users = result.users.map((u) => ({
        ...u,
        email: maskEmail(u.email),
      }));
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

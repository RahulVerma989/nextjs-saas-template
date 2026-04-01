import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin-guard';
import { connectDB } from '@/lib/db/connection';
import { getUserCrud } from '@/lib/db/crud/user';

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';

    await connectDB();
    const userCrud = getUserCrud();
    const result = await userCrud.listUsers({ page, limit, search });

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

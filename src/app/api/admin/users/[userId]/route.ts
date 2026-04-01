import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin-guard';
import { connectDB } from '@/lib/db/connection';
import { getUserCrud } from '@/lib/db/crud/user.crud';
import type { IUser } from '@/types/db.types';

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { userId } = await context.params;

    await connectDB();
    const userCrud = getUserCrud();
    const user = await userCrud.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GET /api/admin/users/[userId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { userId } = await context.params;
    const body = await req.json();
    const { plan, accountStatus, roles } = body;

    const updateData: Record<string, unknown> = {};
    if (plan !== undefined) updateData.plan = plan;
    if (accountStatus !== undefined) updateData.accountStatus = accountStatus;
    if (roles !== undefined) updateData.roles = roles;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await connectDB();
    const userCrud = getUserCrud();
    const user = await userCrud.update(userId, updateData as Partial<IUser>);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/[userId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

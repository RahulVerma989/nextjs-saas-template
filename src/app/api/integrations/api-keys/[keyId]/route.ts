import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { getAPIKeyCrud } from '@/lib/db/crud/api-key.crud';

type RouteContext = { params: Promise<{ keyId: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { keyId } = await context.params;

    await connectDB();
    const apiKeyCrud = getAPIKeyCrud();
    const key = await apiKeyCrud.revokeKey(keyId, session.user.id);

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'API key revoked' },
    });
  } catch (error) {
    console.error('DELETE /api/integrations/api-keys/[keyId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { keyId } = await context.params;
    const body = await req.json();
    const { enabledTools } = body;

    if (!enabledTools || !Array.isArray(enabledTools)) {
      return NextResponse.json(
        { success: false, error: 'enabledTools must be an array' },
        { status: 400 }
      );
    }

    await connectDB();
    const apiKeyCrud = getAPIKeyCrud();
    const key = await apiKeyCrud.updateTools(keyId, session.user.id, enabledTools);

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: key,
    });
  } catch (error) {
    console.error('PATCH /api/integrations/api-keys/[keyId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

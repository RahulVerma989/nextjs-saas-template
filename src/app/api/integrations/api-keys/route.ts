import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { getAPIKeyCrud } from '@/lib/db/crud/api-key.crud';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const apiKeyCrud = getAPIKeyCrud();
    const keys = await apiKeyCrud.listByUser(session.user.id);

    return NextResponse.json({
      success: true,
      data: { keys },
    });
  } catch (error) {
    console.error('GET /api/integrations/api-keys error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, enabledTools } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Key name is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const apiKeyCrud = getAPIKeyCrud();
    const key = await apiKeyCrud.create({
      userId: session.user.id,
      name,
      enabledTools: enabledTools || [],
    });

    return NextResponse.json(
      {
        success: true,
        data: key,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/integrations/api-keys error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

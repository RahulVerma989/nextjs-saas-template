import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceRegistry } from '@/lib/services/registry';

type RouteContext = { params: Promise<{ serviceId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { serviceId } = await context.params;

    const registry = getServiceRegistry();
    const result = await registry.execute(serviceId, 'manual');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(`POST /api/services/[serviceId] error:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute service' },
      { status: 500 }
    );
  }
}

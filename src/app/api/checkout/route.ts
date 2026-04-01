import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/payments/dodo-client';

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
    const { plan } = body;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan is required' },
        { status: 400 }
      );
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email!,
      plan,
    });

    return NextResponse.json({
      success: true,
      data: { url: checkoutSession.url },
    });
  } catch (error) {
    console.error('POST /api/checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

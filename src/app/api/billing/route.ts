import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Subscription } from '@/lib/db/models/subscription.model';

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
    const subscription = await Subscription.findOne({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    console.error('GET /api/billing error:', error);
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
    const { action } = body;

    if (!action || !['cancel', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "cancel" or "reactivate"' },
        { status: 400 }
      );
    }

    await connectDB();
    const subscription = await Subscription.findOne({
      userId: session.user.id,
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      subscription.status = 'canceling';
      subscription.cancelAt = subscription.currentPeriodEnd;
    } else if (action === 'reactivate') {
      if (subscription.status !== 'canceling') {
        return NextResponse.json(
          { success: false, error: 'Subscription is not in canceling state' },
          { status: 400 }
        );
      }
      subscription.status = 'active';
      subscription.cancelAt = undefined;
    }

    await subscription.save();

    return NextResponse.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    console.error('POST /api/billing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

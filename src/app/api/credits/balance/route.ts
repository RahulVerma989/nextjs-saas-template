import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { getUserCrud } from '@/lib/db/crud/user';

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
    const userCrud = getUserCrud();
    const balance = await userCrud.getCreditBalance(session.user.id);

    return NextResponse.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    console.error('GET /api/credits/balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

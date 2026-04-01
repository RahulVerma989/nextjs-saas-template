import { auth } from './auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return { authorized: false as const, error: 'Not authenticated', status: 401, session: null };
  }

  const roles = session.user.roles || [];
  if (!roles.includes('admin')) {
    return { authorized: false as const, error: 'Forbidden: admin access required', status: 403, session: null };
  }

  return { authorized: true as const, error: null, status: 200, session };
}

export async function requireAdminApi() {
  const result = await requireAdmin();

  if (!result.authorized) {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: result.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
            message: result.error,
          },
        },
        { status: result.status }
      ),
    };
  }

  return { session: result.session!, response: null };
}

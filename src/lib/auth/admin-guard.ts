import { auth } from './auth';
import { NextResponse } from 'next/server';
import { isAdminWriteAllowed } from './demo';

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

/**
 * Same as `requireAdminApi` but additionally short-circuits with a
 * 403 in demo mode.  Use this on every admin endpoint that mutates
 * state (PATCH / POST / DELETE) so a public demo deploy can't be
 * vandalised.  Reads stay open so visitors can still see the data.
 */
export async function requireAdminWriteApi() {
  const adminCheck = await requireAdminApi();
  if (adminCheck.response) return adminCheck;

  const email = adminCheck.session?.user?.email ?? null;
  if (!isAdminWriteAllowed(email)) {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'DEMO_MODE',
            message: 'Demo mode is enabled — destructive admin actions are disabled.',
          },
        },
        { status: 403 }
      ),
    };
  }

  return adminCheck;
}

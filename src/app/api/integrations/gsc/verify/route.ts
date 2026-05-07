import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, requireAdminWriteApi } from '@/lib/auth/admin-guard';
import {
  fetchVerificationToken,
  runVerification,
  refreshVerificationStatus,
} from '@/lib/services/gsc.service';
import type { GSCVerificationMethod } from '@/types/db.types';

const VALID: GSCVerificationMethod[] = ['META', 'FILE', 'DNS_TXT'];

function parseMethod(value: unknown): GSCVerificationMethod | null {
  return typeof value === 'string' && (VALID as string[]).includes(value)
    ? (value as GSCVerificationMethod)
    : null;
}

/**
 * GET /api/integrations/gsc/verify
 *   - With ?method=META|FILE|DNS_TXT: fetch a fresh verification
 *     token from Google and persist the relevant fields.  Returns the
 *     updated connection so the UI can render the instructions.
 *   - Without ?method: re-checks GSC for the current verification
 *     status (cheap, no token allocation).
 *
 * POST /api/integrations/gsc/verify
 *   - Body { method }: ask Google to verify ownership using the most
 *     recently fetched token for that method.  The token must already
 *     be live (META tag on homepage, file at /<name>, DNS TXT record).
 */
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdminWriteApi();
  if (adminCheck.response) return adminCheck.response;

  const method = parseMethod(req.nextUrl.searchParams.get('method'));
  try {
    if (method) {
      const conn = await fetchVerificationToken(method);
      return NextResponse.json({ success: true, data: { conn } });
    }
    const conn = await refreshVerificationStatus();
    return NextResponse.json({ success: true, data: { conn } });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed',
      },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdminWriteApi();
  if (adminCheck.response) return adminCheck.response;

  let method: GSCVerificationMethod | null = null;
  try {
    const body = (await req.json()) as { method?: unknown };
    method = parseMethod(body.method);
  } catch {
    // empty body — handled below
  }
  if (!method) {
    return NextResponse.json(
      { success: false, error: 'method must be one of META, FILE, DNS_TXT' },
      { status: 400 },
    );
  }

  try {
    const result = await runVerification(method);
    if (result.verified) {
      return NextResponse.json({ success: true, data: result });
    }
    return NextResponse.json(
      {
        success: false,
        error:
          result.error ??
          'Google could not confirm ownership. Make sure the token is live on your site, then retry.',
        data: result,
      },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Verification failed',
      },
      { status: 500 },
    );
  }
}

// Read endpoint also used by non-write admins to check status without
// allocating a token.  Keep `requireAdminApi` available so we can fork
// a separate read route later if needed.
void requireAdminApi;

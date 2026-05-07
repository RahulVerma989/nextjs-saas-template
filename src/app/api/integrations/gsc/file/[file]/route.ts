import { NextRequest, NextResponse } from 'next/server';
import { getGSCVerificationSnapshot } from '@/lib/services/gsc-meta';

export const dynamic = 'force-dynamic';

/**
 * Serves Google's site-verification file at `/google<token>.html`.
 *
 * Reachable in two ways:
 *   1. Directly (e.g. by Google's verifier hitting
 *      `/api/integrations/gsc/file/google<token>.html`).
 *   2. Via the proxy rewrite that forwards root-level
 *      `/google*.html` requests to this handler — that's how
 *      Google's actual probe lands here.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!/^google[a-z0-9]+\.html$/i.test(file)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const snap = await getGSCVerificationSnapshot();
  if (!snap.fileName || !snap.fileContent) {
    return new NextResponse('Not Found', { status: 404 });
  }
  if (file.toLowerCase() !== snap.fileName.toLowerCase()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return new NextResponse(snap.fileContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

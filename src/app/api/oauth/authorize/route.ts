import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/connection';
import { getOAuthClientCrud, getOAuthCodeCrud } from '@/lib/db/crud/oauth.crud';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    // Redirect to login with the full authorize URL as callback
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { searchParams } = request.nextUrl;
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope') || 'mcp';

  if (!clientId || !redirectUri || responseType !== 'code' || !codeChallenge) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters (client_id, redirect_uri, response_type=code, code_challenge)' },
      { status: 400 }
    );
  }

  if (codeChallengeMethod && codeChallengeMethod !== 'S256') {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Only S256 code_challenge_method is supported' },
      { status: 400 }
    );
  }

  await connectDB();
  const clientCrud = getOAuthClientCrud();
  const client = await clientCrud.findById(clientId);

  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client not found' },
      { status: 400 }
    );
  }

  if (!client.redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'redirect_uri not registered' },
      { status: 400 }
    );
  }

  // Auto-approve: issue code immediately (no consent screen)
  const codeCrud = getOAuthCodeCrud();
  const code = await codeCrud.createCode({
    clientId,
    userId: session.user.id,
    redirectUri,
    codeChallenge,
    codeChallengeMethod: codeChallengeMethod || 'S256',
    scope,
  });

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('code', code);
  if (state) callbackUrl.searchParams.set('state', state);

  return NextResponse.redirect(callbackUrl.toString());
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db/connection';
import { getOAuthClientCrud, getOAuthCodeCrud, getOAuthTokenCrud } from '@/lib/db/crud/oauth.crud';
import type { OAuthTokenResponse } from '@/types/oauth.types';

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function verifyCodeChallenge(codeVerifier: string, codeChallenge: string): boolean {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const computed = base64UrlEncode(hash);
  return computed === codeChallenge;
}

export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } else {
    body = await request.json();
  }

  const grantType = body.grant_type;

  await connectDB();

  if (grantType === 'authorization_code') {
    return handleAuthorizationCode(body);
  } else if (grantType === 'refresh_token') {
    return handleRefreshToken(body);
  } else {
    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Supported: authorization_code, refresh_token' },
      { status: 400 }
    );
  }
}

async function handleAuthorizationCode(body: Record<string, string>) {
  const { code, client_id, redirect_uri, code_verifier } = body;

  if (!code || !client_id || !redirect_uri || !code_verifier) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const clientCrud = getOAuthClientCrud();
  const client = await clientCrud.validateClient(client_id, body.client_secret);
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client authentication failed' },
      { status: 401 }
    );
  }

  const codeCrud = getOAuthCodeCrud();
  const authCode = await codeCrud.consumeCode(code);
  if (!authCode) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
      { status: 400 }
    );
  }

  if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Code was not issued for this client/redirect_uri' },
      { status: 400 }
    );
  }

  if (!verifyCodeChallenge(code_verifier, authCode.codeChallenge)) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'PKCE verification failed' },
      { status: 400 }
    );
  }

  const tokenCrud = getOAuthTokenCrud();
  const tokens = await tokenCrud.issueTokens({
    clientId: client_id,
    userId: authCode.userId,
    scope: authCode.scope,
  });

  const response: OAuthTokenResponse = {
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
    refresh_token: tokens.refreshToken,
    scope: authCode.scope,
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
  });
}

async function handleRefreshToken(body: Record<string, string>) {
  const { refresh_token, client_id } = body;

  if (!refresh_token || !client_id) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing refresh_token or client_id' },
      { status: 400 }
    );
  }

  const clientCrud = getOAuthClientCrud();
  const client = await clientCrud.validateClient(client_id, body.client_secret);
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client authentication failed' },
      { status: 401 }
    );
  }

  const tokenCrud = getOAuthTokenCrud();
  const tokens = await tokenCrud.refreshTokens(refresh_token, client_id);
  if (!tokens) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired refresh token' },
      { status: 400 }
    );
  }

  const response: OAuthTokenResponse = {
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
    refresh_token: tokens.refreshToken,
    scope: 'mcp',
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { getOAuthClientCrud } from '@/lib/db/crud/oauth.crud';
import type { OAuthClientRegistration, OAuthClientResponse } from '@/types/oauth.types';

export async function POST(request: NextRequest) {
  try {
    const body: OAuthClientRegistration = await request.json();

    if (!body.client_name || !body.redirect_uris?.length) {
      return NextResponse.json(
        { error: 'invalid_client_metadata', error_description: 'client_name and redirect_uris are required' },
        { status: 400 }
      );
    }

    // Validate redirect URIs
    for (const uri of body.redirect_uris) {
      try {
        const url = new URL(uri);
        if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          return NextResponse.json(
            { error: 'invalid_redirect_uri', error_description: `Redirect URI must use HTTPS: ${uri}` },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'invalid_redirect_uri', error_description: `Invalid URL: ${uri}` },
          { status: 400 }
        );
      }
    }

    await connectDB();
    const clientCrud = getOAuthClientCrud();

    const { client, clientSecret } = await clientCrud.registerClient({
      clientName: body.client_name,
      redirectUris: body.redirect_uris,
      grantTypes: body.grant_types,
      responseTypes: body.response_types,
      tokenEndpointAuthMethod: body.token_endpoint_auth_method || 'none',
    });

    const response: OAuthClientResponse = {
      client_id: client._id,
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
      response_types: client.responseTypes,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[OAuth Register] Error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Registration failed' },
      { status: 500 }
    );
  }
}

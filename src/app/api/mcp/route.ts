import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { getAPIKeyCrud, APIKeyCrud } from '@/lib/db/crud/api-key.crud';
import { getUserCrud } from '@/lib/db/crud/user.crud';
import { getOAuthTokenCrud } from '@/lib/db/crud/oauth.crud';
import { executeTool, getToolDefinitions } from '@/lib/mcp/tools';
import { checkMCPRateLimit, recordMCPSuccess } from '@/lib/mcp/rate-limiter';
import type { Plan, MCPToolId } from '@/types/db.types';

interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

function jsonrpcSuccess(id: string | number, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

function jsonrpcError(id: string | number | null, code: number, message: string, data?: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } });
}

async function authenticateRequest(
  request: NextRequest
): Promise<{ userId: string; apiKeyId: string; enabledTools: string[]; plan: Plan } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return jsonrpcError(null, -32000, 'Missing Authorization header');
  }

  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) {
    return jsonrpcError(null, -32000, 'Invalid Authorization header');
  }

  await connectDB();

  // Bearer token (OAuth access token)
  if (scheme.toLowerCase() === 'bearer') {
    const tokenCrud = getOAuthTokenCrud();
    const oauthToken = await tokenCrud.validateAccessToken(token);
    if (!oauthToken) {
      return jsonrpcError(null, -32000, 'Invalid or expired access token');
    }

    const userCrud = getUserCrud();
    const user = await userCrud.findById(oauthToken.userId);
    if (!user || user.accountStatus !== 'approved') {
      return jsonrpcError(null, -32000, 'User not found or not approved');
    }

    // OAuth tokens get all tools
    const allToolIds = (await import('@/config/mcp-tools.config')).MCP_TOOLS.map((t) => t.id);
    return { userId: user._id, apiKeyId: `oauth:${oauthToken._id}`, enabledTools: allToolIds, plan: user.plan as Plan };
  }

  // API Key auth
  if (scheme.toLowerCase() === 'apikey' || token.startsWith('sk_')) {
    const rawKey = scheme.toLowerCase() === 'apikey' ? token : authHeader;
    const keyHash = APIKeyCrud.hashKey(rawKey);
    const apiKeyCrud = getAPIKeyCrud();
    const apiKey = await apiKeyCrud.findByHash(keyHash);

    if (!apiKey) {
      return jsonrpcError(null, -32000, 'Invalid API key');
    }

    const userCrud = getUserCrud();
    const user = await userCrud.findById(apiKey.userId);
    if (!user || user.accountStatus !== 'approved') {
      return jsonrpcError(null, -32000, 'User not found or not approved');
    }

    await apiKeyCrud.touchLastUsed(apiKey._id);
    return { userId: user._id, apiKeyId: apiKey._id, enabledTools: apiKey.enabledTools, plan: user.plan as Plan };
  }

  return jsonrpcError(null, -32000, 'Unsupported authentication scheme');
}

export async function POST(request: NextRequest) {
  let body: JSONRPCRequest;
  try {
    body = await request.json();
  } catch {
    return jsonrpcError(null, -32700, 'Parse error');
  }

  if (body.jsonrpc !== '2.0' || !body.method || body.id === undefined) {
    return jsonrpcError(body?.id ?? null, -32600, 'Invalid JSON-RPC request');
  }

  // Handle initialization (no auth required)
  if (body.method === 'initialize') {
    return jsonrpcSuccess(body.id, {
      protocolVersion: '2025-03-26',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'saas-template-mcp', version: '1.0.0' },
    });
  }

  // All other methods require auth
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { userId, apiKeyId, enabledTools, plan } = authResult;

  switch (body.method) {
    case 'tools/list': {
      const tools = getToolDefinitions(enabledTools);
      return jsonrpcSuccess(body.id, { tools });
    }

    case 'tools/call': {
      const params = body.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
      if (!params?.name) {
        return jsonrpcError(body.id, -32602, 'Missing tool name');
      }

      if (!enabledTools.includes(params.name)) {
        return jsonrpcError(body.id, -32602, `Tool '${params.name}' is not enabled for this API key`);
      }

      // Rate limit check
      const rateLimit = await checkMCPRateLimit(userId, plan);
      if (!rateLimit.allowed) {
        return jsonrpcError(body.id, -32000, 'Rate limit exceeded', {
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt.toISOString(),
        });
      }

      const { result, isError } = await executeTool(
        params.name,
        params.arguments || {},
        userId,
        apiKeyId
      );

      if (!isError) {
        await recordMCPSuccess(userId, apiKeyId, params.name as MCPToolId);
      }

      return jsonrpcSuccess(body.id, {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        isError,
      });
    }

    default:
      return jsonrpcError(body.id, -32601, `Method '${body.method}' not found`);
  }
}

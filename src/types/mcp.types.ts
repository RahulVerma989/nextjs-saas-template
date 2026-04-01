/**
 * MCP (Model Context Protocol) types.
 */

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: {
    content: { type: string; text: string }[];
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPToolResult {
  content: { type: string; text: string }[];
  isError?: boolean;
}

export interface MCPAuthContext {
  userId: string;
  apiKeyId: string;
  plan: string;
  enabledTools: string[];
}

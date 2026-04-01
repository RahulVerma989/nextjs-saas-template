import { MCP_TOOLS, getToolById } from '@/config/mcp-tools.config';
import { handleReportFeedback } from './definitions/feedback';
import { handleGetUserProfile } from './definitions/user-profile';
import { handleGetUsageStats } from './definitions/usage-stats';

export type ToolHandler = (
  args: Record<string, unknown>,
  userId: string,
  apiKeyId: string
) => Promise<Record<string, unknown>>;

/**
 * Registry of tool ID -> handler function.
 * Add your custom MCP tool handlers here.
 */
const TOOL_HANDLERS: Record<string, ToolHandler> = {
  report_feedback: handleReportFeedback,
  get_user_profile: handleGetUserProfile,
  get_usage_stats: handleGetUsageStats,
};

/**
 * Execute an MCP tool by ID
 */
export async function executeTool(
  toolId: string,
  args: Record<string, unknown>,
  userId: string,
  apiKeyId: string
): Promise<{ result: Record<string, unknown>; isError: boolean }> {
  const toolDef = getToolById(toolId);
  if (!toolDef) {
    return {
      result: { error: `Unknown tool: ${toolId}` },
      isError: true,
    };
  }

  const handler = TOOL_HANDLERS[toolId];
  if (!handler) {
    return {
      result: { error: `Tool '${toolId}' is defined but has no handler implementation` },
      isError: true,
    };
  }

  try {
    const result = await handler(args, userId, apiKeyId);
    return { result, isError: false };
  } catch (error) {
    console.error(`[MCP] Tool '${toolId}' execution error:`, error);
    return {
      result: {
        error: error instanceof Error ? error.message : 'Tool execution failed',
      },
      isError: true,
    };
  }
}

/**
 * Get tool definitions for the tools/list MCP method
 */
export function getToolDefinitions(enabledToolIds: string[]) {
  return MCP_TOOLS
    .filter((tool) => enabledToolIds.includes(tool.id))
    .map((tool) => ({
      name: tool.id,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
}

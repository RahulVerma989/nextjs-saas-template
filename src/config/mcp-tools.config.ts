/**
 * MCP Tool Definitions.
 *
 * Register your MCP tools here. Each tool is gated by plan and
 * can be enabled/disabled per API key. Tools are auto-discovered
 * by the MCP endpoint.
 *
 * To add a new tool:
 * 1. Add the definition here
 * 2. Create the handler in `src/lib/mcp/tools/definitions/`
 * 3. The tool is automatically available via the MCP endpoint
 */

import type { Plan } from '@/types/db.types';

export type MCPToolCategory = 'read' | 'write' | 'generate' | 'analytics';

export interface MCPToolDefinition {
  /** Unique tool identifier (used in tool calls) */
  id: string;
  /** Human-readable name */
  name: string;
  /** LLM-optimized description of what the tool does */
  description: string;
  /** Tool category for organization */
  category: MCPToolCategory;
  /** Minimum plan required to use this tool */
  minPlan: Plan;
  /** If true, this tool is exempt from rate limiting */
  rateLimitExempt?: boolean;
}

/**
 * Plan hierarchy for access checks.
 */
export const PLAN_HIERARCHY: Record<Plan, number> = {
  free: 0,
  early_adopter: 1,
  starter: 2,
  pro: 3,
  enterprise: 4,
};

/**
 * Rate limits per plan (daily requests).
 */
export const MCP_RATE_LIMITS: Record<Plan, { perWindow: number; perMinute: number; windowMs: number }> = {
  free: { perWindow: 25, perMinute: 5, windowMs: 86_400_000 },
  early_adopter: { perWindow: 500, perMinute: 30, windowMs: 86_400_000 },
  starter: { perWindow: 300, perMinute: 20, windowMs: 86_400_000 },
  pro: { perWindow: 1500, perMinute: 80, windowMs: 86_400_000 },
  enterprise: { perWindow: 5000, perMinute: 150, windowMs: 86_400_000 },
};

/**
 * Register your MCP tools here.
 *
 * These are example tools — replace with your own.
 */
export const MCP_TOOLS: MCPToolDefinition[] = [
  // ─── Example Read Tools ──────────────────────────────────
  {
    id: 'get_user_profile',
    name: 'Get User Profile',
    description: 'Get the authenticated user\'s profile information including name, email, and plan.',
    category: 'read',
    minPlan: 'free',
  },
  {
    id: 'list_api_keys',
    name: 'List API Keys',
    description: 'List all API keys for the authenticated user. Shows key prefix, name, and last used date.',
    category: 'read',
    minPlan: 'free',
  },
  {
    id: 'get_usage_stats',
    name: 'Get Usage Stats',
    description: 'Get the current API usage statistics including credits remaining and MCP request count.',
    category: 'read',
    minPlan: 'free',
  },

  // ─── Example Write Tools ─────────────────────────────────
  {
    id: 'update_profile',
    name: 'Update Profile',
    description: 'Update the authenticated user\'s profile settings such as name and notification preferences.',
    category: 'write',
    minPlan: 'free',
  },

  // ─── Feedback (always free, rate-limit exempt) ────────────
  {
    id: 'report_feedback',
    name: 'Report Feedback',
    description: 'Report a bug, provide feedback, or suggest a feature improvement. Include detailed information about what happened.',
    category: 'write',
    minPlan: 'free',
    rateLimitExempt: true,
  },
];

/**
 * Get tools available for a given plan.
 */
export function getToolsForPlan(plan: Plan): MCPToolDefinition[] {
  const planLevel = PLAN_HIERARCHY[plan] ?? 0;
  return MCP_TOOLS.filter((tool) => PLAN_HIERARCHY[tool.minPlan] <= planLevel);
}

/**
 * Find a tool definition by ID.
 */
export function getToolById(id: string): MCPToolDefinition | undefined {
  return MCP_TOOLS.find((tool) => tool.id === id);
}

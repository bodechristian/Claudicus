import type { McpServerDefinition } from "@claudicus/domain";

/**
 * The only file touched to add a new predefined MCP server. Selection state
 * and header values for these are runtime data (see db/repositories/mcp-server-state-repository.ts) —
 * this registry defines what servers exist, where to reach them, and which header
 * keys (not values) they expect, e.g. headerKeys: ["Authorization"].
 */
export const MCP_SERVER_REGISTRY: McpServerDefinition[] = [
  {
    id: "demo",
    name: "Demo Server",
    description: "Local fixture server exposing echo and collect_feedback (elicitation) tools.",
    url: "http://localhost:3100/mcp",
    headerKeys: ["X-OAuth-Token"],
  },
];

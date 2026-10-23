import type { AggregatedToolDescriptor } from "@claudicus/domain";
import { getServerState } from "../db/repositories/mcp-server-state-repository.js";
import { isConnected, listTools } from "../mcp/mcp-client-manager.js";
import { MCP_SERVER_REGISTRY } from "../mcp/server-registry.js";

export async function computeMergedTools(): Promise<AggregatedToolDescriptor[]> {
  const descriptors: AggregatedToolDescriptor[] = [];

  for (const definition of MCP_SERVER_REGISTRY) {
    const state = getServerState(definition.id);
    // A selected server can still be disconnected (e.g. it was unreachable on
    // startup); skip it rather than failing the whole chat turn.
    if (!state?.selected || !isConnected(definition.id)) {
      continue;
    }
    const { tools } = await listTools(definition.id);
    for (const tool of tools) {
      descriptors.push({
        namespacedName: `${definition.id}__${tool.name}`,
        serverId: definition.id,
        originalName: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      });
    }
  }

  return descriptors;
}

export function toClaudeTools(
  descriptors: AggregatedToolDescriptor[],
): Array<{ name: string; description: string; input_schema: unknown }> {
  return descriptors.map((descriptor) => ({
    name: descriptor.namespacedName,
    description: descriptor.description ?? "",
    input_schema: descriptor.inputSchema,
  }));
}

export function findByNamespacedName(
  descriptors: AggregatedToolDescriptor[],
  namespacedName: string,
): AggregatedToolDescriptor | undefined {
  return descriptors.find((descriptor) => descriptor.namespacedName === namespacedName);
}

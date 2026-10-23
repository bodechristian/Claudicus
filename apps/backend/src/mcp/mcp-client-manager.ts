import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { ElicitRequest, ElicitResult } from "@modelcontextprotocol/client";
import type { McpServerDefinition } from "@claudicus/domain";
import { handleElicitation } from "../domain/elicitation-bridge.js";

interface ManagedServer {
  client: Client;
  currentToolCallId?: string;
}

const managedServers = new Map<string, ManagedServer>();

async function connectServer(definition: McpServerDefinition, headers: Record<string, string>): Promise<ManagedServer> {
  const entry: ManagedServer = { client: undefined as unknown as Client };

  const client = new Client(
    { name: "claudicus", version: "0.1.0" },
    {
      capabilities: { elicitation: { form: {} } },
      versionNegotiation: { mode: { pin: "2026-07-28" } },
    },
  );

  client.setRequestHandler("elicitation/create", (request: ElicitRequest): Promise<ElicitResult> => {
    if (!entry.currentToolCallId) {
      throw new Error(`Received elicitation/create from server "${definition.id}" outside of a tracked tool call`);
    }
    return handleElicitation(definition.id, entry.currentToolCallId, request);
  });

  const transport = new StreamableHTTPClientTransport(new URL(definition.url), {
    requestInit: { headers },
  });

  await client.connect(transport);

  entry.client = client;
  return entry;
}

export async function ensureConnected(
  definition: McpServerDefinition,
  headers: Record<string, string>,
): Promise<Client> {
  const existing = managedServers.get(definition.id);
  if (existing) {
    return existing.client;
  }
  const entry = await connectServer(definition, headers);
  managedServers.set(definition.id, entry);
  return entry.client;
}

export function isConnected(serverId: string): boolean {
  return managedServers.has(serverId);
}

export function disconnectServer(serverId: string): void {
  const entry = managedServers.get(serverId);
  if (!entry) {
    return;
  }
  managedServers.delete(serverId);
  void entry.client.close();
}

export async function callTool(
  serverId: string,
  toolCallId: string,
  toolName: string,
  args: unknown,
): ReturnType<Client["callTool"]> {
  const entry = managedServers.get(serverId);
  if (!entry) {
    throw new Error(`MCP server "${serverId}" is not connected`);
  }
  entry.currentToolCallId = toolCallId;
  try {
    return await entry.client.callTool({ name: toolName, arguments: args as Record<string, unknown> });
  } finally {
    entry.currentToolCallId = undefined;
  }
}

export async function listTools(serverId: string) {
  const entry = managedServers.get(serverId);
  if (!entry) {
    throw new Error(`MCP server "${serverId}" is not connected`);
  }
  return entry.client.listTools();
}

export async function listResources(serverId: string) {
  const entry = managedServers.get(serverId);
  if (!entry) {
    throw new Error(`MCP server "${serverId}" is not connected`);
  }
  return entry.client.listResources();
}

export async function listPrompts(serverId: string) {
  const entry = managedServers.get(serverId);
  if (!entry) {
    throw new Error(`MCP server "${serverId}" is not connected`);
  }
  return entry.client.listPrompts();
}

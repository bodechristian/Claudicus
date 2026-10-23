import type { McpServerRuntimeView } from "@claudicus/domain";
import type { FastifyInstance } from "fastify";
import { getServerState, setServerHeaders, setServerSelected } from "../db/repositories/mcp-server-state-repository.js";
import { disconnectServer, ensureConnected } from "../mcp/mcp-client-manager.js";
import { MCP_SERVER_REGISTRY } from "../mcp/server-registry.js";

function toRuntimeView(definition: (typeof MCP_SERVER_REGISTRY)[number]): McpServerRuntimeView {
  const state = getServerState(definition.id);
  const headers: Record<string, string> = {};
  for (const key of definition.headerKeys) {
    headers[key] = state?.headers?.[key] ?? "";
  }
  return {
    ...definition,
    selected: state?.selected ?? false,
    headers,
  };
}

export async function registerServerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/servers", async () => MCP_SERVER_REGISTRY.map(toRuntimeView));

  app.patch<{ Params: { id: string }; Body: { selected?: boolean; headers?: Record<string, string> } }>(
    "/api/servers/:id",
    async (request, reply) => {
      const definition = MCP_SERVER_REGISTRY.find((server) => server.id === request.params.id);
      if (!definition) {
        return reply.code(404).send({ message: "Unknown server" });
      }

      const { selected, headers } = request.body;
      if (headers !== undefined) {
        const allowedKeys = new Set(definition.headerKeys);
        const filtered = Object.fromEntries(
          Object.entries(headers).filter(([key]) => allowedKeys.has(key)),
        );
        setServerHeaders(definition.id, filtered);
      }

      const wantsSelected = selected ?? getServerState(definition.id)?.selected ?? false;
      if (wantsSelected) {
        // Connect before persisting selection, so a server we can't reach never
        // ends up marked "selected" without a live connection behind it.
        try {
          await ensureConnected(definition, toRuntimeView(definition).headers);
        } catch (error) {
          request.log.error({ err: error, serverId: definition.id }, "Failed to connect MCP server");
          return reply.code(502).send({ message: `Could not connect to MCP server "${definition.name}"` });
        }
      } else {
        disconnectServer(definition.id);
      }

      if (selected !== undefined) {
        setServerSelected(definition.id, selected);
      }

      return toRuntimeView(definition);
    },
  );
}

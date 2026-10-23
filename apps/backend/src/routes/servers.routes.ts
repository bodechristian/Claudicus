import type { McpServerRuntimeView } from "@claudicus/domain";
import type { FastifyInstance } from "fastify";
import { getServerState, setServerHeaders, setServerSelected } from "../db/repositories/mcp-server-state-repository.js";
import { disconnectServer, ensureConnected, isConnected, reconnect } from "../mcp/mcp-client-manager.js";
import { MCP_SERVER_REGISTRY } from "../mcp/server-registry.js";

type ServerDefinition = (typeof MCP_SERVER_REGISTRY)[number];

// Restricts stored/submitted headers to the definition's declared keys, defaulting missing ones to "".
function resolveHeaders(definition: ServerDefinition, source: Record<string, string> | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const key of definition.headerKeys) {
    headers[key] = source?.[key] ?? "";
  }
  return headers;
}

function toRuntimeView(definition: ServerDefinition): McpServerRuntimeView {
  const state = getServerState(definition.id);
  return {
    ...definition,
    selected: state?.selected ?? false,
    headers: resolveHeaders(definition, state?.headers),
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
      const nextHeaders = headers !== undefined ? resolveHeaders(definition, headers) : toRuntimeView(definition).headers;

      const wantsSelected = selected ?? getServerState(definition.id)?.selected ?? false;
      if (wantsSelected) {
        // Connect before persisting anything, so a server we can't reach (or that rejects
        // the new headers) never ends up marked "selected" or saved with those headers.
        // A live connection's headers are fixed, so a header change forces a reconnect.
        try {
          if (headers !== undefined && isConnected(definition.id)) {
            await reconnect(definition, nextHeaders);
          } else {
            await ensureConnected(definition, nextHeaders);
          }
        } catch (error) {
          request.log.error({ err: error, serverId: definition.id }, "Failed to connect MCP server");
          return reply.code(502).send({ message: `Could not connect to MCP server "${definition.name}"` });
        }
      } else {
        disconnectServer(definition.id);
      }

      if (headers !== undefined) {
        setServerHeaders(definition.id, nextHeaders);
      }
      if (selected !== undefined) {
        setServerSelected(definition.id, selected);
      }

      return toRuntimeView(definition);
    },
  );
}

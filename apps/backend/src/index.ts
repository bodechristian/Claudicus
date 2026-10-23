import fastifyWebsocket from "@fastify/websocket";
import Fastify from "fastify";
import { config } from "./config.js";
import { getServerState } from "./db/repositories/mcp-server-state-repository.js";
import { ensureConnected } from "./mcp/mcp-client-manager.js";
import { MCP_SERVER_REGISTRY } from "./mcp/server-registry.js";
import { registerServerRoutes } from "./routes/servers.routes.js";
import { registerStaticRoutes } from "./routes/static.routes.js";
import { registerWsRoute } from "./ws/ws-server.js";

const app = Fastify({ logger: true });

await app.register(fastifyWebsocket);

// MCP client connections are in-memory only; selection state survives a
// restart in SQLite, but the connections themselves don't, so reconnect
// whatever was selected before this process started.
await Promise.all(
  MCP_SERVER_REGISTRY.map(async (definition) => {
    const state = getServerState(definition.id);
    if (state?.selected) {
      await ensureConnected(definition, state.headers).catch((error: unknown) => {
        app.log.error({ error, serverId: definition.id }, "Failed to reconnect selected MCP server on startup");
      });
    }
  }),
);

app.get("/api/health", async () => ({ status: "ok" }));

await registerServerRoutes(app);
await registerWsRoute(app);
await registerStaticRoutes(app);

app
  .listen({ port: config.port, host: "0.0.0.0" })
  .then((address) => app.log.info(`Claudicus backend listening on ${address}`))
  .catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });

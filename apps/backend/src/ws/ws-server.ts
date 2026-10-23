import type { FastifyInstance } from "fastify";
import { getMessageHistory } from "../db/repositories/chat-message-repository.js";
import { handleUserMessage } from "../domain/chat-loop.js";
import { resolveElicitation } from "../domain/elicitation-bridge.js";
import { registerConnection } from "./connection-registry.js";
import { parseClientMessage } from "./protocol-guards.js";

export async function registerWsRoute(app: FastifyInstance): Promise<void> {
  app.get("/ws", { websocket: true }, (socket) => {
    registerConnection(socket);
    socket.send(JSON.stringify({ type: "chat:history", payload: { messages: getMessageHistory() } }));

    socket.on("message", (raw: Buffer) => {
      const message = parseClientMessage(raw.toString());
      if (!message) {
        return;
      }

      if (message.type === "chat:send") {
        void handleUserMessage(message.payload.content).catch((error: unknown) => {
          app.log.error(error);
          socket.send(JSON.stringify({ type: "error", payload: { message: "Failed to process message" } }));
        });
        return;
      }

      resolveElicitation(message.payload.requestKey, message.payload.response);
    });
  });
}

import type { ServerToClientMessage } from "@claudicus/domain";
import type { WebSocket } from "ws";

const connections = new Set<WebSocket>();

export function registerConnection(socket: WebSocket): void {
  connections.add(socket);
  socket.on("close", () => connections.delete(socket));
}

export function broadcast(message: ServerToClientMessage): void {
  const payload = JSON.stringify(message);
  for (const socket of connections) {
    if (socket.readyState === socket.OPEN) {
      socket.send(payload);
    }
  }
}

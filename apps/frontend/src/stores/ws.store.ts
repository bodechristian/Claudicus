import type { ClientToServerMessage, ServerToClientMessage } from "@claudicus/domain";
import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

type Listener = (message: ServerToClientMessage) => void;

export const useWsStore = defineStore("ws", () => {
  const connected = ref(false);
  const socket = shallowRef<WebSocket | null>(null);
  const listeners = new Set<Listener>();

  function connect(): void {
    if (socket.value) {
      return;
    }
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}/ws`);

    ws.addEventListener("open", () => {
      connected.value = true;
    });
    ws.addEventListener("close", () => {
      connected.value = false;
      socket.value = null;
      setTimeout(connect, 1000);
    });
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data as string) as ServerToClientMessage;
      for (const listener of listeners) {
        listener(message);
      }
    });

    socket.value = ws;
  }

  function send(message: ClientToServerMessage): void {
    socket.value?.send(JSON.stringify(message));
  }

  function onMessage(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { connected, connect, send, onMessage };
});

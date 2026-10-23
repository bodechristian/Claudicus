import type { ElicitationCreateRequest, ElicitationResponseAction, Message, ToolCallInfo } from "@claudicus/domain";
import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { useWsStore } from "./ws.store.js";

interface PendingElicitation {
  toolCallId: string;
  requestKey: string;
  request: ElicitationCreateRequest;
}

export const useChatStore = defineStore("chat", () => {
  const messages = ref<Message[]>([]);
  const toolCalls = reactive(new Map<string, ToolCallInfo>());
  const pendingElicitations = reactive(new Map<string, PendingElicitation>());

  const ws = useWsStore();

  ws.onMessage((message) => {
    switch (message.type) {
      case "chat:history": {
        messages.value = message.payload.messages;
        break;
      }
      case "chat:messageStart": {
        messages.value.push({
          id: message.payload.messageId,
          role: message.payload.role,
          content: "",
          createdAt: new Date().toISOString(),
        });
        break;
      }
      case "chat:token": {
        const target = messages.value.find((item) => item.id === message.payload.messageId);
        if (target) {
          target.content += message.payload.token;
        }
        break;
      }
      case "chat:messageEnd": {
        break;
      }
      case "tool:call": {
        const info: ToolCallInfo = {
          id: message.payload.toolCallId,
          serverId: message.payload.serverId,
          toolName: message.payload.toolName,
          input: message.payload.input,
          status: "running",
        };
        toolCalls.set(info.id, info);
        const target = messages.value.find((item) => item.id === message.payload.messageId);
        if (target) {
          target.toolCalls = [...(target.toolCalls ?? []), info];
        }
        break;
      }
      case "tool:status": {
        const info = toolCalls.get(message.payload.toolCallId);
        if (info) {
          info.status = message.payload.status;
          info.result = message.payload.result;
          info.error = message.payload.error;
        }
        break;
      }
      case "elicitation:request": {
        const [requestKey, request] = Object.entries(message.payload.inputRequests)[0] ?? [];
        if (!requestKey || !request) {
          break;
        }
        pendingElicitations.set(message.payload.toolCallId, {
          toolCallId: message.payload.toolCallId,
          requestKey,
          request,
        });
        const info = toolCalls.get(message.payload.toolCallId);
        if (info) {
          info.status = "awaiting_input";
        }
        break;
      }
      case "error": {
        console.error("Server error:", message.payload.message);
        break;
      }
    }
  });

  function sendMessage(content: string): void {
    ws.send({ type: "chat:send", payload: { content } });
  }

  function respondToElicitation(toolCallId: string, response: ElicitationResponseAction): void {
    const pending = pendingElicitations.get(toolCallId);
    if (!pending) {
      return;
    }
    ws.send({ type: "elicitation:respond", payload: { requestKey: pending.requestKey, response } });
    pendingElicitations.delete(toolCallId);

    const info = toolCalls.get(toolCallId);
    if (info) {
      info.status = response.action === "accept" ? "running" : response.action === "decline" ? "declined" : "cancelled";
    }
  }

  return { messages, toolCalls, pendingElicitations, sendMessage, respondToElicitation };
});

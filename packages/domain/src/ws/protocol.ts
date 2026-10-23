import type { Message } from "../chat/message.js";
import type { ElicitationCreateRequest, ElicitationResponse } from "../mcp/elicitation.js";
import type { ToolCallStatus } from "../mcp/tool.js";

export type ClientToServerMessage =
  | { type: "chat:send"; payload: { content: string } }
  | { type: "elicitation:respond"; payload: ElicitationResponse };

export type ServerToClientMessage =
  | { type: "chat:history"; payload: { messages: Message[] } }
  | { type: "chat:messageStart"; payload: { messageId: string; role: "assistant" } }
  | { type: "chat:token"; payload: { messageId: string; token: string } }
  | { type: "chat:messageEnd"; payload: { messageId: string } }
  | {
      type: "tool:call";
      payload: { toolCallId: string; messageId: string; serverId: string; toolName: string; input: unknown };
    }
  | {
      type: "tool:status";
      payload: { toolCallId: string; status: ToolCallStatus; result?: unknown; error?: string };
    }
  | {
      type: "elicitation:request";
      payload: { toolCallId: string; inputRequests: Record<string, ElicitationCreateRequest> };
    }
  | { type: "error"; payload: { message: string } };

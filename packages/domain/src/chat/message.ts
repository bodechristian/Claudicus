import type { ToolCallInfo } from "../mcp/tool.js";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCallInfo[];
  createdAt: string;
}

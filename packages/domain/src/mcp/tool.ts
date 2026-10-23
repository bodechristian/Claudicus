export type ToolCallStatus =
  | "pending"
  | "awaiting_input"
  | "running"
  | "success"
  | "error"
  | "declined"
  | "cancelled";

export interface ToolCallInfo {
  id: string;
  serverId: string;
  toolName: string;
  input: unknown;
  status: ToolCallStatus;
  result?: unknown;
  error?: string;
}

export interface AggregatedToolDescriptor {
  namespacedName: string;
  serverId: string;
  originalName: string;
  description?: string;
  inputSchema: unknown;
}

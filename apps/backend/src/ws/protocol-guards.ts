import type { ClientToServerMessage, ElicitationResponse, ElicitationResponseAction } from "@claudicus/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isElicitationResponseAction(value: unknown): value is ElicitationResponseAction {
  if (!isRecord(value)) {
    return false;
  }
  if (value.action === "accept") {
    return isRecord(value.content);
  }
  return value.action === "decline" || value.action === "cancel";
}

function isElicitationResponse(value: unknown): value is ElicitationResponse {
  return isRecord(value) && typeof value.requestKey === "string" && isElicitationResponseAction(value.response);
}

export function parseClientMessage(raw: string): ClientToServerMessage | undefined {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (!isRecord(data) || typeof data.type !== "string") {
    return undefined;
  }

  if (data.type === "chat:send" && isRecord(data.payload) && typeof data.payload.content === "string") {
    return { type: "chat:send", payload: { content: data.payload.content } };
  }

  if (data.type === "elicitation:respond" && isElicitationResponse(data.payload)) {
    return { type: "elicitation:respond", payload: data.payload };
  }

  return undefined;
}

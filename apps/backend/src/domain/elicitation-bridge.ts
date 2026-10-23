import { randomUUID } from "node:crypto";
import type { ElicitRequest, ElicitResult } from "@modelcontextprotocol/client";
import { validateElicitationResponseContent, type ElicitationResponseAction, type RequestedSchema } from "@claudicus/domain";
import { broadcast } from "../ws/connection-registry.js";

interface PendingElicitation {
  resolve: (result: ElicitResult) => void;
  requestedSchema: RequestedSchema;
}

const pending = new Map<string, PendingElicitation>();

/**
 * Invoked by the SDK's auto-fulfilment engine (registered as the client's
 * `elicitation/create` handler) whenever a tool call embeds an elicitation
 * request. Pushes it to the browser over WS and resolves once the matching
 * `elicitation:respond` message arrives — the SDK retries the original
 * `tools/call` with the result itself, so there is no manual retry loop here.
 */
export function handleElicitation(_serverId: string, toolCallId: string, request: ElicitRequest): Promise<ElicitResult> {
  const requestKey = randomUUID();
  const params = request.params;
  if (params.mode === "url") {
    // URL-mode elicitation isn't supported; there's no form to render.
    return Promise.resolve({ action: "decline" });
  }

  return new Promise<ElicitResult>((resolve) => {
    pending.set(requestKey, { resolve, requestedSchema: params.requestedSchema });
    broadcast({
      type: "elicitation:request",
      payload: {
        toolCallId,
        inputRequests: {
          [requestKey]: { method: "elicitation/create", params },
        },
      },
    });
  });
}

export function resolveElicitation(requestKey: string, response: ElicitationResponseAction): void {
  const entry = pending.get(requestKey);
  if (!entry) {
    return;
  }
  pending.delete(requestKey);

  if (response.action !== "accept") {
    entry.resolve({ action: response.action });
    return;
  }

  const validation = validateElicitationResponseContent(entry.requestedSchema, response.content);
  if (!validation.valid) {
    // The frontend already gates Accept on this same validator; reaching here
    // means a stale/tampered submission, so fail closed as a decline.
    entry.resolve({ action: "decline" });
    return;
  }

  entry.resolve({ action: "accept", content: response.content as NonNullable<ElicitResult["content"]> });
}

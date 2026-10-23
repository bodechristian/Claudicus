import type { McpServerRuntimeView, SystemPromptRuntimeView } from "@claudicus/domain";

export async function getServers(): Promise<McpServerRuntimeView[]> {
  const response = await fetch("/api/servers");
  return (await response.json()) as McpServerRuntimeView[];
}

export async function patchServer(
  id: string,
  body: { selected?: boolean; headers?: Record<string, string> },
): Promise<McpServerRuntimeView> {
  const response = await fetch(`/api/servers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? `Request failed with status ${response.status}`);
  }
  return (await response.json()) as McpServerRuntimeView;
}

export async function getSystemPrompts(): Promise<SystemPromptRuntimeView[]> {
  const response = await fetch("/api/system-prompts");
  return (await response.json()) as SystemPromptRuntimeView[];
}

/** `id: null` deactivates the current prompt, so no system prompt is sent. */
export async function putActiveSystemPrompt(id: string | null): Promise<SystemPromptRuntimeView[]> {
  const response = await fetch("/api/system-prompts/active", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? `Request failed with status ${response.status}`);
  }
  return (await response.json()) as SystemPromptRuntimeView[];
}

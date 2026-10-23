import type { McpServerRuntimeView } from "@claudicus/domain";

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

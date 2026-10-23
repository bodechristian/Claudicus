import { db } from "../client.js";

export interface McpServerStateRow {
  server_id: string;
  selected: number;
  headers_json: string;
  updated_at: string;
}

export interface McpServerState {
  serverId: string;
  selected: boolean;
  headers: Record<string, string>;
}

function rowToState(row: McpServerStateRow): McpServerState {
  return {
    serverId: row.server_id,
    selected: row.selected === 1,
    headers: JSON.parse(row.headers_json) as Record<string, string>,
  };
}

const selectStmt = db.prepare<[string], McpServerStateRow>(
  "SELECT * FROM mcp_server_state WHERE server_id = ?",
);
const selectAllStmt = db.prepare<[], McpServerStateRow>("SELECT * FROM mcp_server_state");
const upsertStmt = db.prepare<{ serverId: string; selected: number; headersJson: string }>(`
  INSERT INTO mcp_server_state (server_id, selected, headers_json, updated_at)
  VALUES (@serverId, @selected, @headersJson, datetime('now'))
  ON CONFLICT(server_id) DO UPDATE SET
    selected = @selected,
    headers_json = @headersJson,
    updated_at = datetime('now')
`);

export function getServerState(serverId: string): McpServerState | undefined {
  const row = selectStmt.get(serverId);
  return row ? rowToState(row) : undefined;
}

export function getAllServerStates(): McpServerState[] {
  return selectAllStmt.all().map(rowToState);
}

export function setServerSelected(serverId: string, selected: boolean): void {
  const existing = getServerState(serverId);
  upsertStmt.run({
    serverId,
    selected: selected ? 1 : 0,
    headersJson: JSON.stringify(existing?.headers ?? {}),
  });
}

export function setServerHeaders(serverId: string, headers: Record<string, string>): void {
  const existing = getServerState(serverId);
  upsertStmt.run({
    serverId,
    selected: existing?.selected ? 1 : 0,
    headersJson: JSON.stringify(headers),
  });
}

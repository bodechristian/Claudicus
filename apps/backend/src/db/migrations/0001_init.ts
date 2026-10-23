export const INIT_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS mcp_server_state (
  server_id    TEXT PRIMARY KEY,
  selected     INTEGER NOT NULL DEFAULT 0,
  headers_json TEXT NOT NULL DEFAULT '{}',
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id           TEXT PRIMARY KEY,
  role         TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content_json TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

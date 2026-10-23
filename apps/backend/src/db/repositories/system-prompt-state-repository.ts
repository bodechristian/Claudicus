import { db } from "../client.js";

const ACTIVE_SYSTEM_PROMPT_KEY = "active_system_prompt_id";

const selectStmt = db.prepare<[string], { value: string }>("SELECT value FROM app_settings WHERE key = ?");
const upsertStmt = db.prepare<{ key: string; value: string }>(`
  INSERT INTO app_settings (key, value, updated_at)
  VALUES (@key, @value, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET
    value = @value,
    updated_at = datetime('now')
`);
const deleteStmt = db.prepare<[string]>("DELETE FROM app_settings WHERE key = ?");

export function getActiveSystemPromptId(): string | null {
  return selectStmt.get(ACTIVE_SYSTEM_PROMPT_KEY)?.value ?? null;
}

/** Passing null clears the active prompt, so no system prompt is sent. */
export function setActiveSystemPromptId(id: string | null): void {
  if (id === null) {
    deleteStmt.run(ACTIVE_SYSTEM_PROMPT_KEY);
  } else {
    upsertStmt.run({ key: ACTIVE_SYSTEM_PROMPT_KEY, value: id });
  }
}

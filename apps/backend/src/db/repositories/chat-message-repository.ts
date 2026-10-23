import type { Message } from "@claudicus/domain";
import { db } from "../client.js";

interface ChatMessageRow {
  id: string;
  role: string;
  content_json: string;
  created_at: string;
}

const insertStmt = db.prepare<{ id: string; role: string; contentJson: string }>(`
  INSERT INTO chat_messages (id, role, content_json)
  VALUES (@id, @role, @contentJson)
`);
const selectAllStmt = db.prepare<[], ChatMessageRow>(
  "SELECT * FROM chat_messages ORDER BY rowid ASC",
);

export function appendMessage(message: Message): void {
  insertStmt.run({
    id: message.id,
    role: message.role,
    contentJson: JSON.stringify(message),
  });
}

export function getMessageHistory(): Message[] {
  return selectAllStmt.all().map((row) => JSON.parse(row.content_json) as Message);
}

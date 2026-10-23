import type { SystemPromptDefinition } from "@claudicus/domain";
import { getActiveSystemPromptId } from "../db/repositories/system-prompt-state-repository.js";

/**
 * Predefined system prompts. Which one is active (if any) is runtime state persisted
 * in SQLite via system-prompt-state-repository, the same way MCP server selection is.
 */
export const SYSTEM_PROMPT_REGISTRY: SystemPromptDefinition[] = [
  {
    id: "no-yapping",
    name: "No Yapping Zone",
    prompt:
      "STOP YAPPING SO MUCH - NO YAPPING ZONE.",
  },
];

export function getActiveSystemPrompt(): string | undefined {
  const activeId = getActiveSystemPromptId();
  return SYSTEM_PROMPT_REGISTRY.find((entry) => entry.id === activeId)?.prompt;
}

export interface SystemPromptDefinition {
  id: string;
  name: string;
  prompt: string;
}

/**
 * Predefined system prompts. For now the active one is fixed via ACTIVE_SYSTEM_PROMPT_ID;
 * once users can pick or author prompts, the active id (and custom prompts) become
 * runtime state persisted in SQLite, the same way MCP server selection is.
 */
export const SYSTEM_PROMPT_REGISTRY: SystemPromptDefinition[] = [
  {
    id: "no-yapping",
    name: "No Yapping Zone",
    prompt:
      "STOP YAPPING SO MUCH - NO YAPPING ZONE.",
  },
];

export const ACTIVE_SYSTEM_PROMPT_ID = "no-yapping";

export function getActiveSystemPrompt(): string | undefined {
  return SYSTEM_PROMPT_REGISTRY.find((entry) => entry.id === ACTIVE_SYSTEM_PROMPT_ID)?.prompt;
}

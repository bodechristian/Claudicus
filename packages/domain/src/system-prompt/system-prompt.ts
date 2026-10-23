export interface SystemPromptDefinition {
  id: string;
  name: string;
  prompt: string;
}

export interface SystemPromptRuntimeView extends SystemPromptDefinition {
  /** At most one prompt in the registry is active at a time; none active means no system prompt is sent. */
  active: boolean;
}

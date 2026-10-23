import type { SystemPromptRuntimeView } from "@claudicus/domain";
import type { FastifyInstance } from "fastify";
import { SYSTEM_PROMPT_REGISTRY } from "../claude/system-prompt-registry.js";
import {
  getActiveSystemPromptId,
  setActiveSystemPromptId,
} from "../db/repositories/system-prompt-state-repository.js";

function toRuntimeViews(): SystemPromptRuntimeView[] {
  const activeId = getActiveSystemPromptId();
  return SYSTEM_PROMPT_REGISTRY.map((definition) => ({ ...definition, active: definition.id === activeId }));
}

export async function registerSystemPromptRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/system-prompts", async () => toRuntimeViews());

  // Activation is exclusive, so it's a single "which one is active" resource rather than
  // a per-prompt flag. `id: null` deactivates, leaving no system prompt.
  app.put<{ Body: { id: string | null } }>("/api/system-prompts/active", async (request, reply) => {
    const { id } = request.body;
    if (id !== null && !SYSTEM_PROMPT_REGISTRY.some((definition) => definition.id === id)) {
      return reply.code(404).send({ message: "Unknown system prompt" });
    }
    setActiveSystemPromptId(id);
    return toRuntimeViews();
  });
}

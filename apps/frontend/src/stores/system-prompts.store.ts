import type { SystemPromptRuntimeView } from "@claudicus/domain";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { getSystemPrompts, putActiveSystemPrompt } from "../lib/api.js";

export const useSystemPromptsStore = defineStore("systemPrompts", () => {
  const prompts = ref<SystemPromptRuntimeView[]>([]);
  const activeId = computed(() => prompts.value.find((prompt) => prompt.active)?.id ?? null);

  async function load(): Promise<void> {
    prompts.value = await getSystemPrompts();
  }

  async function setActive(id: string | null): Promise<void> {
    prompts.value = await putActiveSystemPrompt(id);
  }

  return { prompts, activeId, load, setActive };
});

<script setup lang="ts">
import { computed, ref } from "vue";
import { useSystemPromptsStore } from "../../stores/system-prompts.store.js";

// Quick on/off card for one registry prompt. Activating it replaces whichever prompt was
// active; deactivating it leaves no system prompt at all.
const props = defineProps<{ promptId: string }>();
const systemPromptsStore = useSystemPromptsStore();

const prompt = computed(() => systemPromptsStore.prompts.find((entry) => entry.id === props.promptId));
const isSaving = ref(false);
const errorMessage = ref<string | null>(null);

async function toggle(): Promise<void> {
  if (!prompt.value) {
    return;
  }
  errorMessage.value = null;
  isSaving.value = true;
  try {
    await systemPromptsStore.setActive(prompt.value.active ? null : prompt.value.id);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <button
    v-if="prompt"
    type="button"
    class="prompt-toggle"
    :class="{ active: prompt.active }"
    :aria-pressed="prompt.active"
    :disabled="isSaving"
    :title="errorMessage ?? prompt.prompt"
    @click="toggle"
  >
    <span class="prompt-toggle-indicator" aria-hidden="true" />
    <span class="prompt-toggle-name">{{ prompt.name }}</span>
    <span class="prompt-toggle-state">{{ prompt.active ? "on" : "off" }}</span>
  </button>
</template>

<style scoped>
.prompt-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  font-size: 13px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.prompt-toggle:not(:disabled):hover {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.prompt-toggle:disabled {
  opacity: 0.6;
  cursor: progress;
}

.prompt-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.prompt-toggle-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
}

.prompt-toggle-name {
  font-weight: 600;
}

.prompt-toggle-state {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prompt-toggle.active {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface));
  color: var(--color-text);
}

.prompt-toggle.active .prompt-toggle-indicator {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.prompt-toggle.active .prompt-toggle-state {
  color: var(--color-accent);
}
</style>

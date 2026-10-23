<script setup lang="ts">
import type { McpServerRuntimeView } from "@claudicus/domain";
import { computed, ref } from "vue";
import { useServersStore } from "../../stores/servers.store.js";
import HeaderEditor from "./HeaderEditor.vue";

const props = defineProps<{ server: McpServerRuntimeView }>();
const serversStore = useServersStore();

// Header edits stay local until saved; saving reconnects the server with the new values.
// The draft is only re-synced from the server after a successful save, so other updates
// (e.g. toggling selection) never clobber unsaved input.
const draftHeaders = ref<Record<string, string>>({ ...props.server.headers });

const isDirty = computed(() =>
  props.server.headerKeys.some((key) => (draftHeaders.value[key] ?? "") !== (props.server.headers[key] ?? "")),
);
const isSaving = ref(false);
const errorMessage = ref<string | null>(null);

async function run(action: () => Promise<void>): Promise<void> {
  errorMessage.value = null;
  isSaving.value = true;
  try {
    await action();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isSaving.value = false;
  }
}

function toggleSelected(event: Event): void {
  const checkbox = event.target as HTMLInputElement;
  const checked = checkbox.checked;
  void run(async () => {
    try {
      await serversStore.setSelected(props.server.id, checked);
    } catch (error) {
      checkbox.checked = props.server.selected;
      throw error;
    }
  });
}

function saveHeaders(): void {
  void run(async () => {
    await serversStore.setHeaders(props.server.id, { ...draftHeaders.value });
    draftHeaders.value = { ...props.server.headers };
  });
}
</script>

<template>
  <div class="server-card card" :class="{ selected: server.selected }">
    <div class="server-card-header">
      <label class="checkbox-row">
        <input type="checkbox" :checked="server.selected" @change="toggleSelected" />
        <span class="server-name">{{ server.name }}</span>
      </label>
      <span class="server-url">{{ server.url }}</span>
    </div>
    <p class="server-description">{{ server.description }}</p>
    <template v-if="server.headerKeys.length">
      <HeaderEditor v-model:headers="draftHeaders" :header-keys="server.headerKeys" />
      <div class="server-card-actions">
        <span v-if="isDirty" class="unsaved-hint">Unsaved changes</span>
        <button class="btn btn-primary btn-small" :disabled="!isDirty || isSaving" @click="saveHeaders">
          {{ isSaving ? "Saving…" : "Save settings" }}
        </button>
      </div>
    </template>
    <p v-if="errorMessage" class="server-error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.server-card {
  margin-bottom: var(--space-4);
}

.server-card.selected {
  border-color: var(--color-accent);
}

.server-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.server-name {
  font-weight: 600;
}

.server-url {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-muted);
}

.server-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.unsaved-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.server-error {
  color: var(--color-error);
  font-size: 13px;
  margin: var(--space-2) 0 0;
}

.server-description {
  color: var(--color-text-muted);
  font-size: 13px;
  margin: var(--space-2) 0 0;
}
</style>

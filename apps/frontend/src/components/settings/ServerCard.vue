<script setup lang="ts">
import type { McpServerRuntimeView } from "@claudicus/domain";
import { useServersStore } from "../../stores/servers.store.js";
import HeaderEditor from "./HeaderEditor.vue";

const props = defineProps<{ server: McpServerRuntimeView }>();
const serversStore = useServersStore();

function toggleSelected(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  void serversStore.setSelected(props.server.id, checked);
}

function updateHeaders(headers: Record<string, string>): void {
  void serversStore.setHeaders(props.server.id, headers);
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
    <HeaderEditor :header-keys="server.headerKeys" :headers="server.headers" @update:headers="updateHeaders" />
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

.server-description {
  color: var(--color-text-muted);
  font-size: 13px;
  margin: var(--space-2) 0 0;
}
</style>

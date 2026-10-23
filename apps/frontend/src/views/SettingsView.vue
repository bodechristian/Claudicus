<script setup lang="ts">
import { onMounted } from "vue";
import ServerCard from "../components/settings/ServerCard.vue";
import { useServersStore } from "../stores/servers.store.js";

const serversStore = useServersStore();
onMounted(() => serversStore.load());
</script>

<template>
  <div class="settings-view">
    <h1>MCP Servers</h1>
    <p class="settings-hint">Select which servers' tools are made available to Claude.</p>
    <ServerCard v-for="server in serversStore.servers" :key="server.id" :server="server" />
  </div>
</template>

<style scoped>
.settings-view {
  padding: var(--space-5);
  overflow-y: auto;
  height: 100%;
  max-width: 70ch;
}

.settings-hint {
  color: var(--color-text-muted);
  margin-top: 0;
}
</style>

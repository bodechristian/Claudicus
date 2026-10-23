<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink, RouterView } from "vue-router";
import SystemPromptQuickToggle from "./components/system-prompt/SystemPromptQuickToggle.vue";
import { useSystemPromptsStore } from "./stores/system-prompts.store.js";
import { useWsStore } from "./stores/ws.store.js";

const ws = useWsStore();
const systemPromptsStore = useSystemPromptsStore();
onMounted(() => {
  ws.connect();
  void systemPromptsStore.load();
});
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="topbar-start">
        <span class="brand">Claudicus</span>
        <nav class="nav">
          <RouterLink to="/" class="nav-link">Chat</RouterLink>
          <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
        </nav>
      </div>
      <SystemPromptQuickToggle prompt-id="no-yapping" />
      <span class="status" :class="{ connected: ws.connected }">
        {{ ws.connected ? "connected" : "connecting…" }}
      </span>
    </header>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Equal-width outer columns keep the middle (quick toggle) truly centered. */
.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.brand {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.topbar-start {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.nav {
  display: flex;
  gap: var(--space-4);
}

.nav-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 14px;
  padding: var(--space-1) 0;
  border-bottom: 2px solid transparent;
}

.nav-link.router-link-active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent);
}

.status {
  justify-self: end;
  font-size: 12px;
  color: var(--color-text-muted);
}

.status.connected::before {
  content: "●";
  color: var(--color-success);
  margin-right: var(--space-1);
}

.status:not(.connected)::before {
  content: "●";
  color: var(--color-warning);
  margin-right: var(--space-1);
}

.content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>

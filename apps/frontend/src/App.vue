<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useWsStore } from "./stores/ws.store.js";

const ws = useWsStore();
onMounted(() => ws.connect());
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <span class="brand">Claudicus</span>
      <nav class="nav">
        <RouterLink to="/" class="nav-link">Chat</RouterLink>
        <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
      </nav>
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

.topbar {
  display: flex;
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

.nav {
  display: flex;
  gap: var(--space-4);
  flex: 1;
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

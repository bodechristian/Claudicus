<script setup lang="ts">
import type { ToolCallInfo, ToolCallStatus } from "@claudicus/domain";
import { computed } from "vue";
import { useChatStore } from "../../stores/chat.store.js";
import ElicitationForm from "./ElicitationForm.vue";

const props = defineProps<{ toolCall: ToolCallInfo }>();
const chatStore = useChatStore();

const pending = computed(() => chatStore.pendingElicitations.get(props.toolCall.id));

const statusLabel: Record<ToolCallStatus, string> = {
  pending: "Pending",
  awaiting_input: "Needs input",
  running: "Running",
  success: "Done",
  error: "Error",
  declined: "Declined",
  cancelled: "Cancelled",
};
</script>

<template>
  <div class="tool-call card" :class="`status-${toolCall.status}`">
    <div class="tool-call-header">
      <span class="tool-name">{{ toolCall.toolName }}</span>
      <span class="tool-server">{{ toolCall.serverId }}</span>
      <span class="tool-status">{{ statusLabel[toolCall.status] }}</span>
    </div>

    <details class="tool-details">
      <summary>input</summary>
      <pre>{{ JSON.stringify(toolCall.input, null, 2) }}</pre>
    </details>

    <ElicitationForm v-if="pending" :tool-call-id="toolCall.id" :request="pending.request" />

    <details v-if="toolCall.status === 'success'" class="tool-details" open>
      <summary>result</summary>
      <pre>{{ JSON.stringify(toolCall.result, null, 2) }}</pre>
    </details>

    <p v-if="toolCall.status === 'error'" class="tool-error">{{ toolCall.error }}</p>
  </div>
</template>

<style scoped>
.tool-call {
  margin-top: var(--space-3);
  padding: var(--space-3);
  font-size: 13px;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.tool-name {
  font-weight: 700;
  font-family: var(--font-mono);
}

.tool-server {
  color: var(--color-text-muted);
  font-size: 11px;
}

.tool-status {
  margin-left: auto;
  font-size: 11px;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.status-success .tool-status {
  color: var(--color-success);
}

.status-error .tool-status {
  color: var(--color-error);
}

.status-awaiting_input .tool-status {
  color: var(--color-warning);
}

.tool-details {
  margin-top: var(--space-2);
}

.tool-details pre {
  background: var(--color-bg);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  font-size: 12px;
}

.tool-error {
  color: var(--color-error);
  font-size: 12px;
}
</style>

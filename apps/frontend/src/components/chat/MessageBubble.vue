<script setup lang="ts">
import type { Message } from "@claudicus/domain";
import { computed } from "vue";
import { renderMarkdown } from "../../lib/markdown.js";
import ToolCallCard from "./ToolCallCard.vue";

const props = defineProps<{ message: Message }>();
const html = computed(() => renderMarkdown(props.message.content));
</script>

<template>
  <div class="bubble-row" :class="message.role">
    <div class="bubble" :class="message.role">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="bubble-content" v-html="html" />
      <ToolCallCard v-for="toolCall in message.toolCalls" :key="toolCall.id" :tool-call="toolCall" />
    </div>
  </div>
</template>

<style scoped>
.bubble-row {
  display: flex;
  margin-bottom: var(--space-4);
}

.bubble-row.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 70ch;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.bubble.user {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-color: var(--color-accent);
}

.bubble-content :deep(p:first-child) {
  margin-top: 0;
}

.bubble-content :deep(p:last-child) {
  margin-bottom: 0;
}

.bubble-content :deep(pre) {
  background: var(--color-bg);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  overflow-x: auto;
}

.bubble.user .bubble-content :deep(pre) {
  background: rgba(0, 0, 0, 0.2);
}
</style>

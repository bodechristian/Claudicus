<script setup lang="ts">
import { ref } from "vue";
import { useChatStore } from "../../stores/chat.store.js";

const chatStore = useChatStore();
const draft = ref("");

function submit(): void {
  const content = draft.value.trim();
  if (!content) {
    return;
  }
  chatStore.sendMessage(content);
  draft.value = "";
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
}
</script>

<template>
  <form class="message-input" @submit.prevent="submit">
    <textarea
      v-model="draft"
      class="message-textarea field-input"
      rows="2"
      placeholder="Message Claudicus…"
      @keydown="onKeydown"
    />
    <button type="submit" class="btn btn-primary">Send</button>
  </form>
</template>

<style scoped>
.message-input {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.message-textarea {
  flex: 1;
  resize: none;
}
</style>

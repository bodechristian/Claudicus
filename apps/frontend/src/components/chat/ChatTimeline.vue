<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useChatStore } from "../../stores/chat.store.js";
import MessageBubble from "./MessageBubble.vue";

const chatStore = useChatStore();
const scrollEl = ref<HTMLElement | null>(null);

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick();
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight });
  },
);
</script>

<template>
  <div ref="scrollEl" class="timeline">
    <p v-if="chatStore.messages.length === 0" class="timeline-empty">Say something to get started.</p>
    <MessageBubble v-for="message in chatStore.messages" :key="message.id" :message="message" />
  </div>
</template>

<style scoped>
.timeline {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.timeline-empty {
  color: var(--color-text-muted);
  text-align: center;
  margin-top: var(--space-6);
}
</style>

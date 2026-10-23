<script setup lang="ts">
import ChatTimeline from "../components/chat/ChatTimeline.vue";
import MessageInput from "../components/chat/MessageInput.vue";
</script>

<template>
  <div class="chat-view">
    <ChatTimeline />
    <MessageInput />
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>

<script setup lang="ts">
import type { ElicitationCreateRequest } from "@claudicus/domain";
import { validateElicitationResponseContent } from "@claudicus/domain";
import { computed, reactive } from "vue";
import { useChatStore } from "../../stores/chat.store.js";
import FieldRenderer from "./fields/FieldRenderer.vue";

const props = defineProps<{
  toolCallId: string;
  request: ElicitationCreateRequest;
}>();

const chatStore = useChatStore();
const schema = computed(() => props.request.params.requestedSchema);
const values = reactive<Record<string, unknown>>({});

const validation = computed(() => validateElicitationResponseContent(schema.value, values));
const touched = computed(() => Object.keys(values).length > 0);

function accept(): void {
  if (!validation.value.valid) {
    return;
  }
  chatStore.respondToElicitation(props.toolCallId, { action: "accept", content: { ...values } });
}

function decline(): void {
  chatStore.respondToElicitation(props.toolCallId, { action: "decline" });
}

function cancel(): void {
  chatStore.respondToElicitation(props.toolCallId, { action: "cancel" });
}
</script>

<template>
  <div class="elicitation-form card">
    <p class="elicitation-message">{{ request.params.message }}</p>

    <FieldRenderer
      v-for="(property, name) in schema.properties"
      :key="name"
      :name="name"
      :property="property"
      :required="(schema.required ?? []).includes(name)"
      :model-value="values[name]"
      @update:model-value="(value) => (values[name] = value)"
    />

    <ul v-if="touched && !validation.valid" class="elicitation-errors">
      <li v-for="error in validation.errors" :key="error.property">{{ error.property }}: {{ error.message }}</li>
    </ul>

    <div class="elicitation-actions">
      <button type="button" class="btn btn-primary" :disabled="!validation.valid" @click="accept">Accept</button>
      <button type="button" class="btn btn-secondary" @click="decline">Decline</button>
      <button type="button" class="btn btn-ghost" @click="cancel">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.elicitation-form {
  margin-top: var(--space-3);
  border-color: var(--color-accent);
}

.elicitation-message {
  margin: 0 0 var(--space-4);
  font-weight: 600;
}

.elicitation-errors {
  color: var(--color-error);
  font-size: 12px;
  margin: 0 0 var(--space-3);
  padding-left: var(--space-4);
}

.elicitation-actions {
  display: flex;
  gap: var(--space-2);
}
</style>

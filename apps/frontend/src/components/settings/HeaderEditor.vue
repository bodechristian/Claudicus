<script setup lang="ts">
const props = defineProps<{ headerKeys: string[]; headers: Record<string, string> }>();
const emit = defineEmits<{ "update:headers": [value: Record<string, string>] }>();

function updateValue(key: string, value: string): void {
  emit("update:headers", { ...props.headers, [key]: value });
}
</script>

<template>
  <div v-if="headerKeys.length" class="header-editor">
    <p class="header-editor-hint">
      This server expects the following HTTP headers; enter the values to send with every request.
    </p>
    <div v-for="key in headerKeys" :key="key" class="header-row">
      <span class="header-key">{{ key }}</span>
      <input
        :value="headers[key] ?? ''"
        @input="updateValue(key, ($event.target as HTMLInputElement).value)"
        placeholder="Value"
        class="field-input"
        type="password"
      />
    </div>
  </div>
</template>

<style scoped>
.header-editor {
  margin-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-3);
}

.header-editor-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2);
}

.header-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.header-key {
  font-family: var(--font-mono);
  font-size: 12px;
  min-width: 120px;
}

.header-row .field-input {
  flex: 1;
}
</style>

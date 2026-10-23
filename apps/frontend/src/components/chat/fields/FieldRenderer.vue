<script setup lang="ts">
import type { RequestedSchemaProperty } from "@claudicus/domain";
import { computed } from "vue";

const props = defineProps<{
  name: string;
  property: RequestedSchemaProperty;
  modelValue: unknown;
  required: boolean;
}>();

const emit = defineEmits<{ "update:modelValue": [value: unknown] }>();

function update(value: unknown): void {
  emit("update:modelValue", value);
}

const label = computed(() => props.property.title ?? props.name);

const singleSelectOptions = computed<{ value: string; label: string }[] | undefined>(() => {
  if (props.property.type !== "string") {
    return undefined;
  }
  const property = props.property as { enum?: string[]; oneOf?: { const: string; title: string }[] };
  if (property.enum) {
    return property.enum.map((value) => ({ value, label: value }));
  }
  if (property.oneOf) {
    return property.oneOf.map((option) => ({ value: option.const, label: option.title }));
  }
  return undefined;
});

const multiSelectOptions = computed<{ value: string; label: string }[]>(() => {
  if (props.property.type !== "array") {
    return [];
  }
  const items = props.property.items as { enum?: string[]; anyOf?: { const: string; title: string }[] };
  if (items.enum) {
    return items.enum.map((value) => ({ value, label: value }));
  }
  return (items.anyOf ?? []).map((option) => ({ value: option.const, label: option.title }));
});

function toggleMultiValue(value: string, checked: boolean): void {
  const current = Array.isArray(props.modelValue) ? [...(props.modelValue as string[])] : [];
  if (checked) {
    if (!current.includes(value)) {
      current.push(value);
    }
  } else {
    const index = current.indexOf(value);
    if (index !== -1) {
      current.splice(index, 1);
    }
  }
  update(current);
}

const stringInputType = computed(() => {
  if (props.property.type !== "string") {
    return "text";
  }
  const format = (props.property as { format?: string }).format;
  if (format === "email") return "email";
  if (format === "uri") return "url";
  if (format === "date") return "date";
  if (format === "date-time") return "datetime-local";
  return "text";
});

const numberBounds = computed(() => props.property as { minimum?: number; maximum?: number });
const stringBounds = computed(() => props.property as { minLength?: number; maxLength?: number });
</script>

<template>
  <div class="field">
    <label :for="name" class="field-label"> {{ label }}<span v-if="required" class="required">*</span> </label>
    <p v-if="property.description" class="field-description">{{ property.description }}</p>

    <select
      v-if="singleSelectOptions"
      :id="name"
      class="field-input"
      :value="modelValue ?? ''"
      @change="update(($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>Select…</option>
      <option v-for="option in singleSelectOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <div v-else-if="property.type === 'array'" class="field-multiselect">
      <label v-for="option in multiSelectOptions" :key="option.value" class="checkbox-row">
        <input
          type="checkbox"
          :checked="Array.isArray(modelValue) && (modelValue as string[]).includes(option.value)"
          @change="toggleMultiValue(option.value, ($event.target as HTMLInputElement).checked)"
        />
        {{ option.label }}
      </label>
    </div>

    <label v-else-if="property.type === 'boolean'" class="checkbox-row">
      <input type="checkbox" :checked="Boolean(modelValue)" @change="update(($event.target as HTMLInputElement).checked)" />
      Yes
    </label>

    <input
      v-else-if="property.type === 'number' || property.type === 'integer'"
      :id="name"
      type="number"
      class="field-input"
      :min="numberBounds.minimum"
      :max="numberBounds.maximum"
      :step="property.type === 'integer' ? 1 : 'any'"
      :value="(modelValue as number | undefined) ?? ''"
      @input="update(($event.target as HTMLInputElement).valueAsNumber)"
    />

    <input
      v-else
      :id="name"
      :type="stringInputType"
      class="field-input"
      :minlength="stringBounds.minLength"
      :maxlength="stringBounds.maxLength"
      :value="(modelValue as string | undefined) ?? ''"
      @input="update(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.field {
  margin-bottom: var(--space-3);
}

.field-label {
  display: block;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: var(--space-1);
}

.required {
  color: var(--color-error);
  margin-left: 2px;
}

.field-description {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1);
}

.field-multiselect {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
</style>

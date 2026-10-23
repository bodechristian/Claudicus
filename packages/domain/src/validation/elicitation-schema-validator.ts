import type { MultiSelectEnumSchema, RequestedSchema, RequestedSchemaProperty } from "../mcp/elicitation.js";

export interface ElicitationValidationError {
  property: string;
  message: string;
}

export type ElicitationValidationResult =
  | { valid: true }
  | { valid: false; errors: ElicitationValidationError[] };

const FORMAT_VALIDATORS: Record<string, (value: string) => boolean> = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  uri: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  date: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
  "date-time": (value) => !Number.isNaN(Date.parse(value)),
};

function allowedMultiValues(property: MultiSelectEnumSchema): string[] {
  if ("enum" in property.items) {
    return property.items.enum;
  }
  return property.items.anyOf.map((option) => option.const);
}

function validateProperty(
  name: string,
  property: RequestedSchemaProperty,
  value: unknown,
  errors: ElicitationValidationError[],
): void {
  // Single select: untitled and legacy-titled (`enum` + `enumNames`) both carry `enum`; titled carries `oneOf`.
  if ("enum" in property || "oneOf" in property) {
    const allowed = "enum" in property ? property.enum : property.oneOf.map((option) => option.const);
    if (typeof value !== "string" || !allowed.includes(value)) {
      errors.push({ property: name, message: `must be one of: ${allowed.join(", ")}` });
    }
    return;
  }

  if (property.type === "string") {
    if (typeof value !== "string") {
      errors.push({ property: name, message: "must be a string" });
      return;
    }
    if (property.minLength !== undefined && value.length < property.minLength) {
      errors.push({ property: name, message: `must be at least ${property.minLength} characters` });
    }
    if (property.maxLength !== undefined && value.length > property.maxLength) {
      errors.push({ property: name, message: `must be at most ${property.maxLength} characters` });
    }
    if (property.format) {
      const formatValidator = FORMAT_VALIDATORS[property.format];
      if (formatValidator && !formatValidator(value)) {
        errors.push({ property: name, message: `must be a valid ${property.format}` });
      }
    }
    return;
  }

  if (property.type === "number" || property.type === "integer") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push({ property: name, message: "must be a number" });
      return;
    }
    if (property.type === "integer" && !Number.isInteger(value)) {
      errors.push({ property: name, message: "must be an integer" });
    }
    if (property.minimum !== undefined && value < property.minimum) {
      errors.push({ property: name, message: `must be >= ${property.minimum}` });
    }
    if (property.maximum !== undefined && value > property.maximum) {
      errors.push({ property: name, message: `must be <= ${property.maximum}` });
    }
    return;
  }

  if (property.type === "boolean") {
    if (typeof value !== "boolean") {
      errors.push({ property: name, message: "must be a boolean" });
    }
    return;
  }

  if (property.type === "array") {
    if (!Array.isArray(value)) {
      errors.push({ property: name, message: "must be an array" });
      return;
    }
    if (property.minItems !== undefined && value.length < property.minItems) {
      errors.push({ property: name, message: `must contain at least ${property.minItems} items` });
    }
    if (property.maxItems !== undefined && value.length > property.maxItems) {
      errors.push({ property: name, message: `must contain at most ${property.maxItems} items` });
    }
    const allowed = allowedMultiValues(property);
    for (const item of value) {
      if (typeof item !== "string" || !allowed.includes(item)) {
        errors.push({ property: name, message: `contains an invalid value: ${String(item)}` });
      }
    }
  }
}

export function validateElicitationResponseContent(
  schema: RequestedSchema,
  content: Record<string, unknown>,
): ElicitationValidationResult {
  const errors: ElicitationValidationError[] = [];

  for (const requiredName of schema.required ?? []) {
    if (!(requiredName in content) || content[requiredName] === undefined || content[requiredName] === "") {
      errors.push({ property: requiredName, message: "is required" });
    }
  }

  for (const [name, property] of Object.entries(schema.properties)) {
    const value = content[name];
    const isMissing = value === undefined || value === null;
    const isRequired = schema.required?.includes(name) ?? false;

    if (isMissing) {
      if (isRequired) {
        continue; // already reported above
      }
      continue; // optional + absent is fine
    }

    validateProperty(name, property, value, errors);
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

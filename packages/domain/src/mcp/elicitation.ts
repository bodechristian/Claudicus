interface SchemaPropertyBase {
  title?: string;
  description?: string;
}

export interface StringSchemaProperty extends SchemaPropertyBase {
  type: "string";
  format?: "email" | "uri" | "date" | "date-time";
  minLength?: number;
  maxLength?: number;
  default?: string;
}

export interface NumberSchemaProperty extends SchemaPropertyBase {
  type: "number" | "integer";
  minimum?: number;
  maximum?: number;
  default?: number;
}

export interface BooleanSchemaProperty extends SchemaPropertyBase {
  type: "boolean";
  default?: boolean;
}

export interface EnumConstTitle {
  const: string;
  title: string;
}

export interface SingleSelectEnumSchemaProperty extends SchemaPropertyBase {
  type: "string";
  enum?: string[];
  oneOf?: EnumConstTitle[];
  default?: string;
}

export interface MultiSelectEnumSchemaProperty extends SchemaPropertyBase {
  type: "array";
  items: { type?: "string"; enum: string[] } | { anyOf: EnumConstTitle[] };
  minItems?: number;
  maxItems?: number;
  default?: string[];
}

export type RequestedSchemaProperty =
  | StringSchemaProperty
  | NumberSchemaProperty
  | BooleanSchemaProperty
  | SingleSelectEnumSchemaProperty
  | MultiSelectEnumSchemaProperty;

export interface RequestedSchema {
  type: "object";
  properties: Record<string, RequestedSchemaProperty>;
  required?: string[];
}

/**
 * A single embedded elicitation request as it appears inside an
 * `InputRequiredResult.inputRequests` map. Unlike a standalone JSON-RPC
 * request it carries no `id` of its own — the key it's stored under in
 * that map (an `InputRequests` record, per the SDK's `@modelcontextprotocol/server`
 * types) is what correlates request and response.
 */
export interface ElicitationCreateRequest {
  method: "elicitation/create";
  params: {
    mode?: "form";
    message: string;
    requestedSchema: RequestedSchema;
  };
}

export interface InputRequiredResult {
  /** Keyed by server-assigned identifiers unique within the scope of the request. */
  inputRequests?: Record<string, ElicitationCreateRequest>;
  /** Opaque server state echoed back verbatim by the client on retry. Unused (form mode only, no URL mode). */
  requestState?: string;
}

export type ElicitationResponseAction =
  | { action: "accept"; content: Record<string, unknown> }
  | { action: "decline" }
  | { action: "cancel" };

export interface ElicitationResponse {
  /** The key of the `InputRequests` entry this is answering. */
  requestKey: string;
  response: ElicitationResponseAction;
}

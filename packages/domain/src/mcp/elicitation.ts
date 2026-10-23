// Type-only import: erased at compile time, so domain keeps zero runtime deps.
// The MCP spec types come from the SDK rather than being redefined here.
import type { ElicitRequestFormParams, ElicitResult, PrimitiveSchemaDefinition } from "@modelcontextprotocol/client";

export type {
  ElicitRequestFormParams,
  ElicitResult,
  LegacyTitledEnumSchema,
  MultiSelectEnumSchema,
  PrimitiveSchemaDefinition,
  SingleSelectEnumSchema,
} from "@modelcontextprotocol/client";

/** The spec's form-mode `requestedSchema` object. */
export type RequestedSchema = ElicitRequestFormParams["requestedSchema"];

/** A single field of a {@link RequestedSchema}. */
export type RequestedSchemaProperty = PrimitiveSchemaDefinition;

/**
 * A single embedded elicitation request as relayed to the browser, keyed by
 * a request key in the `elicitation:request` WS payload. Form mode only — URL
 * mode isn't supported.
 */
export interface ElicitationCreateRequest {
  method: "elicitation/create";
  params: ElicitRequestFormParams;
}

/**
 * The browser's answer as it arrives over WS. `content` is deliberately
 * `Record<string, unknown>` rather than the spec's `ElicitResult["content"]`:
 * it is untrusted until re-validated against the requested schema.
 */
export type ElicitationResponseAction =
  | { action: "accept"; content: Record<string, unknown> }
  | { action: Exclude<ElicitResult["action"], "accept"> };

export interface ElicitationResponse {
  /** The key of the `inputRequests` entry this is answering. */
  requestKey: string;
  response: ElicitationResponseAction;
}

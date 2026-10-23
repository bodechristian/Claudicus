export interface McpServerDefinition {
  id: string;
  name: string;
  description: string;
  url: string;
  /** Names of HTTP headers this server expects (e.g. "Authorization"); values are supplied by the user at runtime. */
  headerKeys: string[];
}

export interface McpServerRuntimeView extends McpServerDefinition {
  selected: boolean;
  /** User-supplied values, keyed by the names declared in headerKeys. */
  headers: Record<string, string>;
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Claudicus: a Claude chat UI with a built-in MCP client (protocol version `2026-07-28`, with elicitation support). pnpm workspace monorepo with three apps and one shared package.

## Commands

```sh
pnpm install                                    # install all workspace deps
pnpm dev                                        # domain (watch build) + backend:3000 + frontend:5173, concurrently
pnpm --filter @claudicus/mcp-demo-server dev     # demo MCP server on :3100 (echo + create_car tools)
pnpm build                                      # builds domain -> backend -> frontend, in that order
pnpm typecheck                                  # tsc --noEmit / vue-tsc across all packages
```

Per-package equivalents: `pnpm --filter @claudicus/<name> <script>` (e.g. `dev`, `build`, `typecheck`). Backend and mcp-demo-server use `tsx watch` for dev; domain uses `tsc -w`; frontend uses `vite`.

There is no test runner or linter configured in this repo yet.

Frontend dev server (`:5173`) proxies `/api` and `/ws` to the backend (`:3000`) — see `apps/frontend/vite.config.ts`. The demo MCP server must be selected on the Settings page before its tools are usable in chat.

Env setup: `cp .env.example apps/backend/.env`, then set `ANTHROPIC_API_KEY`. Backend config (`apps/backend/src/config.ts`) reads `PORT`, `DB_PATH`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NODE_ENV`.

## Workspace layout

- `packages/domain` — shared types/schemas with zero runtime deps, consumed by both backend and frontend. Build this first; it emits `dist/` via plain `tsc`. Anything that crosses the backend/frontend boundary (chat messages, the WS wire protocol, MCP server definitions, elicitation types, tool descriptors) lives here, not duplicated in each app.
- `apps/backend` — Fastify server: WS chat endpoint, REST routes for MCP server management, SQLite persistence, the Anthropic SDK integration, and MCP client connections.
- `apps/frontend` — Vue 3 + Pinia + vue-router SPA. Talks to the backend over a single WebSocket (chat + elicitation) plus REST (`/api/servers`) for server management.
- `apps/mcp-demo-server` — standalone fixture MCP server (not built/shipped with the main app) used for local dev/testing of MCP tool calls and elicitation.

In Docker, only `domain`, `backend`, and `frontend` are built and shipped; `mcp-demo-server` is dev-only.

## Backend architecture

Entry point `apps/backend/src/index.ts` wires everything: on boot it reconnects any MCP server previously marked "selected" in SQLite (connections themselves are in-memory and don't survive a restart), then registers REST routes, the WS route, and static file serving, in that order.

**Chat loop** (`src/domain/chat-loop.ts`): `handleUserMessage` runs the full agentic loop for one user message — streams tokens from Anthropic over WS, and when the model emits `tool_use` blocks, dispatches them through the tool aggregator/MCP client manager, feeds `tool_result`s back in, and repeats until there are no more tool calls. Everything (user message, assistant message, tool call info) is persisted via `chat-message-repository` and broadcast to all connected WS clients.

**Tool aggregation** (`src/domain/tool-aggregator.ts`): merges tools from every *selected* MCP server into one flat list for the Anthropic `tools` param. Tool names are namespaced as `{serverId}__{originalName}` to avoid collisions across servers; `findByNamespacedName` reverses that mapping when a `tool_use` block comes back from the model.

**MCP client manager** (`src/mcp/mcp-client-manager.ts`): owns one `Client` per connected server (`managedServers` map, in-memory, keyed by server id). Each client registers an `elicitation/create` request handler that forwards to `elicitation-bridge.ts`. `currentToolCallId` is set on the managed server entry for the duration of a `callTool`, so an elicitation request arriving mid-call can be correlated back to the tool call that triggered it — it's an error for a server to emit elicitation outside of a tracked call.

**Elicitation bridge** (`src/domain/elicitation-bridge.ts`): when an MCP tool call needs user input mid-flight, this pushes an `elicitation:request` over WS and holds the MCP SDK's request open (via an unresolved `Promise`) until the frontend sends back `elicitation:respond`. The MCP SDK itself retries the original `tools/call` once resolved — there's no manual retry logic here. Response content is re-validated server-side against the requested schema before being accepted, even though the frontend already gates the Accept button on the same validator (`@claudicus/domain`'s `validateElicitationResponseContent`) — a failed re-validation fails closed as a decline.

**MCP server registry vs. state**: `src/mcp/server-registry.ts` is a static, hardcoded list of known server definitions (id, name, url) — it's the *only* file to touch when adding a new predefined server. Per-server runtime state (whether it's selected, custom headers) is separate, persisted in SQLite via `db/repositories/mcp-server-state-repository.ts`, and merged with the static definition at read time (see `routes/servers.routes.ts`'s `toRuntimeView`).

**Database**: `src/db/client.ts` opens a `better-sqlite3` connection and runs the init migration synchronously at module load time (not from an explicit call) — this is deliberate, because repository modules call `db.prepare()` at import time, which executes before any other top-level code in `index.ts`, so migrations must already be applied by then. There's a single migration file (`db/migrations/0001_init.ts`); add new ones alongside it rather than editing it in place once it's shipped.

## Frontend architecture

Single WebSocket connection (`stores/ws.store.ts`) multiplexes chat streaming and elicitation; it auto-reconnects with a 1s delay on close. `stores/chat.store.ts` and `stores/servers.store.ts` subscribe to `onMessage` and own derived UI state. REST (`lib/api.ts`) is used only for MCP server management (`/api/servers`), not chat.

Both WS message directions (`ClientToServerMessage` / `ServerToClientMessage`) are typed in `@claudicus/domain`'s `ws/protocol.ts` — when changing the wire protocol, update that file first, then both call sites.

## Adding an MCP server

Edit `apps/backend/src/mcp/server-registry.ts` only — add an entry with id/name/url. Users then select it and optionally set headers from the Settings page; everything else (connecting, tool listing, persistence) is handled generically.

## Cross-cutting conventions

- Everything is ESM (`"type": "module"` everywhere); relative imports use explicit `.js` extensions even in `.ts` source, per `NodeNext` module resolution (`tsconfig.base.json`).
- `packages/domain` has no runtime dependencies by design — don't add any; it's imported by both backend and frontend and must stay environment-agnostic.
- Build order matters: domain must be built before backend/frontend typecheck/build against it (see root `package.json` `build` script and the Dockerfile's multi-stage build).

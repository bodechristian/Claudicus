# Claudicus

Claude chat UI with a built-in MCP client (protocol 2026-07-28, elicitation support).

## Prerequisites

- Node 22+
- pnpm (`corepack enable` picks up the pinned version automatically)

## Setup

```sh
pnpm install
cp .env.example apps/backend/.env   # then fill in ANTHROPIC_API_KEY
```

## Run (dev)

Two terminals:

```sh
pnpm dev                                        # domain (watch) + backend:3000 + frontend:5173
pnpm --filter @claudicus/mcp-demo-server dev     # demo MCP server:3100 (echo + collect_feedback tools)
```

Open http://localhost:5173. The demo server must be selected in Settings before its tools are usable in chat.

## Build / typecheck

```sh
pnpm build        # domain + backend + frontend
pnpm typecheck     # all packages
```

## Docker

Single image serves the API, WebSocket, and built frontend on one port.

```sh
docker build -t claudicus .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-... -v claudicus-data:/data claudicus
```

## Adding an MCP server

Edit `apps/backend/src/mcp/server-registry.ts` — that's the only file touched to register a new server (name, URL). Users then select it in the Settings page.

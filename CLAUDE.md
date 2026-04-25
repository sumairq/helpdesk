# Helpdesk

AI-powered ticket management system for student support. See `project-scope.md`, `tech-stack.md`, and `implementation-plan.md` for full context.

## Stack

- **Frontend:** React + TypeScript + Vite (`client/`)
- **Backend:** Express + TypeScript on Node.js, run via `tsx` in dev (`server/`)
- **Database:** PostgreSQL with `pgvector` (later phases)
- **Auth:** database-backed sessions (`express-session` + `connect-pg-simple`)
- **AI:** Claude API via `@anthropic-ai/sdk`, with prompt caching on the system prompt + knowledgebase
- **Package manager:** npm workspaces (root `package.json` defines `client` and `server`)

## Layout

```
helpdesk/
├── client/   # React + Vite, dev on :5173, proxies /api to :3001
└── server/   # Express, dev on :3001
```

## Dev commands

- `npm install` — install all workspace deps
- `npm run dev` — both client and server in parallel
- `npm run dev:server` / `npm run dev:client` — run individually
- `npm run typecheck` — typecheck both workspaces

## Domain model

- **Ticket statuses:** `open`, `resolved`, `closed`
- **Ticket categories** (one per ticket): `general`, `technical`, `refund`
- **Roles:** `admin` (seeded on deploy, manages users), `agent` (created by admin)

## Conventions

- TypeScript strict mode in both workspaces
- ESM (`"type": "module"`) everywhere
- Server imports use explicit `.ts` extensions where needed (bundler moduleResolution)
- Keep API routes thin; put logic in service modules

## Documentation lookups — use context7

When working with any library, framework, SDK, or CLI in this project (Express, React, Vite, Prisma, `express-session`, `connect-pg-simple`, BullMQ, the Anthropic SDK, Postmark, etc.), **fetch current docs via the context7 MCP server** rather than relying on memory or web search:

1. `mcp__context7__resolve-library-id` to find the library's context7 ID
2. `mcp__context7__query-docs` to fetch the relevant docs

Use it even for libraries you "know" — versions drift, APIs change. Skip it only for general programming concepts, refactoring, or business-logic debugging.

## Out of scope (v1)

Multi-tenancy, additional channels (chat/phone), SLA escalation, multilingual, internal notes/@mentions, customer-facing portal.

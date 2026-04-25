# Helpdesk

AI-powered ticket management system for student support. See `project-scope.md`, `tech-stack.md`, and `implementation-plan.md` for full context.

## Stack

- **Frontend:** React + TypeScript + Vite (`client/`)
- **Backend:** Express + TypeScript on Node.js, run via `tsx` in dev (`server/`)
- **Database:** PostgreSQL with `pgvector` (later phases)
- **Auth:** Better Auth with the Prisma adapter (PostgreSQL), email + password
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

## Authentication

**Better Auth** (`better-auth@^1.6.9`) with the Prisma adapter against PostgreSQL.

**Server** (`server/src/auth.ts`):
- Email + password enabled, **`disableSignUp: true`** — admin seeds the first user, agents are created by an admin (no public signup).
- `additionalFields.role`: enum `[ADMIN, AGENT]` from the Prisma `Role` enum, `defaultValue: AGENT`, `input: false` (clients cannot set it).
- `trustedOrigins` parsed from `TRUSTED_ORIGINS` env (comma-separated).
- Required env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (defaults to `http://localhost:3001`), `TRUSTED_ORIGINS`.

**Express mount** (`server/src/index.ts`): `app.all("/api/auth/*", toNodeHandler(auth))` is registered **before** `app.use(express.json())`. Do not move this — Better Auth needs the raw body. CORS is configured with `credentials: true` and `origin: http://localhost:5173`.

**Client** (`client/src/auth-client.ts`): `createAuthClient` from `better-auth/react`. No `baseURL` is set — requests go to relative `/api/auth/*` and Vite proxies `/api` → `:3001`. Use `authClient.signIn.email({ email, password })`, `authClient.signOut()`, and `authClient.useSession()`.

**Forms:** because of the shadcn + Base UI integration (see below), wire RHF auth forms with `Controller`, not `register` spread, or Zod will see `undefined` and reject the submit before the API call.

## Styling: Tailwind v4

`client/` uses **Tailwind v4** via `@tailwindcss/vite` (no PostCSS plugin, no `tailwind.config.js`). Theme is configured in `client/src/index.css` using `@theme inline { ... }` plus CSS custom properties on `:root` and `.dark`. Import with `@import "tailwindcss"` — the v3 `@tailwind base/components/utilities` directives are gone. The `dark` variant is set up via `@custom-variant dark (&:is(.dark *))`.

## UI: shadcn (`base-nova` preset)

`client/` uses shadcn with the `base-nova` preset (neutral base color, CSS variables, `@/*` → `src/*`). Components live in `client/src/components/ui/`. Theme tokens and a `:-webkit-autofill` override are in `client/src/index.css`. Add components with `cd client && npx shadcn@latest add <name>`.

**Important:** the `base-nova` shadcn primitives wrap `@base-ui/react` (e.g. `Input` → `Field.Control`), not raw HTML. Spreading react-hook-form's `register("field")` onto these does NOT bind the underlying `<input>` — RHF reads `undefined` on submit, and Zod throws `"Invalid input: expected string, received undefined"` instead of your custom message. Use `Controller` instead:

```tsx
<Controller
  control={control}
  name="email"
  render={({ field }) => <Input {...field} type="email" />}
/>
```

Also: `npx shadcn add form` silently no-ops in this registry — just use react-hook-form directly without the `<Form>` wrapper.

## Documentation lookups — use context7

When working with any library, framework, SDK, or CLI in this project (Express, React, Vite, Prisma, `express-session`, `connect-pg-simple`, BullMQ, the Anthropic SDK, Postmark, etc.), **fetch current docs via the context7 MCP server** rather than relying on memory or web search:

1. `mcp__context7__resolve-library-id` to find the library's context7 ID
2. `mcp__context7__query-docs` to fetch the relevant docs

Use it even for libraries you "know" — versions drift, APIs change. Skip it only for general programming concepts, refactoring, or business-logic debugging.

## Out of scope (v1)

Multi-tenancy, additional channels (chat/phone), SLA escalation, multilingual, internal notes/@mentions, customer-facing portal.

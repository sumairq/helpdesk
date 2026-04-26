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
- `BETTER_AUTH_SECRET` is validated at module load — must be ≥32 chars or the server throws before `betterAuth()` runs.
- `minPasswordLength: 12`.
- Rate limiting enabled (`window: 60`, `max: 100`) with a tighter rule on `/sign-in/email` (`max: 5`/min).
- Required env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (defaults to `http://localhost:3001`), `TRUSTED_ORIGINS`.

**Authorization middleware** (`server/src/middleware/auth.ts`): exports `requireAuth` and `requireAdmin`. Both call `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` and stash the session on `res.locals.session`. `requireAdmin` 401s if unauthenticated, 403s if `session.user.role !== "ADMIN"`. **Apply `requireAdmin` to every admin-only API route** (e.g. anything under `/api/users`) — the client-side `AdminRoute` guard is UX only.

**Express mount** (`server/src/index.ts`): `app.all("/api/auth/*", toNodeHandler(auth))` is registered **before** `app.use(express.json())`. Do not move this — Better Auth needs the raw body. CORS is configured with `credentials: true` and `origin: http://localhost:5173`.

**Client** (`client/src/auth-client.ts`): `createAuthClient` from `better-auth/react`. No `baseURL` is set — requests go to relative `/api/auth/*` and Vite proxies `/api` → `:3001`. Use `authClient.signIn.email({ email, password })`, `authClient.signOut()`, and `authClient.useSession()`.

**Forms:** because of the shadcn + Base UI integration (see below), wire RHF auth forms with `Controller`, not `register` spread, or Zod will see `undefined` and reject the submit before the API call.

## Routing & access control

`client/src/App.tsx` composes routes with two guards layered around `Layout`:

- `ProtectedRoute` (`client/src/components/ProtectedRoute.tsx`) — redirects unauthenticated users to `/login`.
- `AdminRoute` (`client/src/components/AdminRoute.tsx`) — nested inside `ProtectedRoute`; redirects non-admins to `/`.
- `RedirectIfAuthed` wraps `/login` so signed-in users bounce to `/`.

Routes:

- `/login` — `LoginPage`. RHF + Zod via `Controller`. On success, calls `authClient.signIn.email` and `navigate("/", { replace: true })`. Surfaces server errors in an `Alert`.
- `/` — `HomePage`, behind `ProtectedRoute` + `Layout`.
- `/users` — `UsersPage`, behind `ProtectedRoute` → `AdminRoute` + `Layout`. Currently a heading-only placeholder for admin user management.
- `*` — redirects to `/`.

`Layout` (`client/src/components/Layout.tsx`) renders the top nav (brand, signed-in user name, sign-out button) and conditionally shows a "Users" link when `session?.user.role === "ADMIN"`. Client-side gating is for UX only — always enforce roles server-side on any future `/api/users` endpoints.

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

## Testing: Playwright

E2E tests live at the repo root in `e2e/` and run against a **separate test database** (`helpdesk_test`) via `server/.env.test` (gitignored; copy from `server/.env.test.example`).

- `playwright.config.ts` (root) defines a Chromium project and a `webServer` array that spawns the test server (`npm run start:test --workspace server`) and the Vite client. `baseURL` is `http://localhost:5173`. `testMatch` is restricted to `*.spec.ts` so the setup/teardown files aren't picked up as tests.
- The test server uses `dotenv-cli` to load `server/.env.test`, so it points Prisma at the test DB without touching `.env`.
- The test server runs on the **same port (3001) as dev** — stop `npm run dev:server` before running e2e, or override `PORT` in `.env.test`.

**Global setup/teardown:**

- `e2e/global-setup.ts` runs `npm run db:reset:test --workspace server` (which is `prisma migrate reset --force` — drops the schema, re-applies every migration in `server/prisma/migrations/`), then `npm run seed:test --workspace server` to create the admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Every `npm run test:e2e` starts from a fully migrated, freshly seeded DB.
- Prisma 7 blocks `migrate reset` when invoked by an AI agent; `global-setup.ts` sets `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=yes` in the spawned environment to bypass the guard. **This is safe only because `db:reset:test` is hard-wired to `dotenv -e .env.test`** — it can never touch the dev DB. Never copy this env var into any other script that could run against `.env`.
- `e2e/global-teardown.ts` is a stub — expand it if you add shared resources that need cleanup.
- `server/src/reset.ts` (and the `reset:test` script) is a manual truncate+seed helper kept around for one-off use; it's no longer on the e2e path.

**TypeScript scope:**

- `e2e/tsconfig.json` covers `e2e/**/*.ts` and `playwright.config.ts`, with `types: ["node", "@playwright/test"]`. `@types/node` is installed at the root workspace so node globals (`process`, `node:child_process`) resolve in the IDE.

Scripts:

- `npm run test:e2e` — run Playwright tests
- `npm run test:e2e:ui` — Playwright UI mode
- `npm run test:e2e:setup` — `prisma db push` + `seed` against the test DB (legacy first-time helper; ongoing resets are handled by `global-setup.ts`)
- Server-scoped helpers: `start:test`, `db:migrate:test`, `db:push:test`, `db:reset:test`, `seed:test`, `reset:test` — all run via `dotenv -e .env.test --` so the test DB is used regardless of which `.env` is present.

First-time setup: create the `helpdesk_test` Postgres database, copy `.env.test.example` → `.env.test` and fill in DB password + a fresh 32-char `BETTER_AUTH_SECRET`, then `npm run test:e2e` (global-setup will run migrations and seed automatically).

## Out of scope (v1)

Multi-tenancy, additional channels (chat/phone), SLA escalation, multilingual, internal notes/@mentions, customer-facing portal.

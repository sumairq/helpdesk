---
name: Auth patterns for Helpdesk e2e tests
description: How authentication works in tests — fixtures, agent seeding, storageState, and Better Auth API
type: project
---

**Admin credentials:** read from `server/.env.test` via `e2e/helpers/env.ts`. Never hardcode.

**storageState fixture (`e2e/fixtures/auth.ts`):**
- `adminPage` — browser context pre-authenticated as seeded admin (role: ADMIN, name: "Admin")
- `agentPage` — seeds agent via `seedAgentUser()`, then authenticates as agent (role: AGENT, name: "Agent User")
- Authentication via direct POST to `/api/auth/sign-in/email` (not UI login) — fast and reliable.
- Each fixture creates its own browser context → tests are fully isolated.
- Import `{ test, expect }` from `./fixtures/auth.js` to get both custom and standard fixtures.

**Agent seeding:** Better Auth admin plugin is NOT enabled in `server/src/auth.ts` — there is no `/api/auth/admin/create-user` endpoint. Agent must be seeded via `server/src/seed-agent.ts` (Prisma direct write + Better Auth password hash). Run via npm script `seed-agent:test`.

**Sign-in endpoint:** `POST /api/auth/sign-in/email` (proxied by Vite from :5173 to :3001).

**Error shape:** `{ error: { message, status, statusText } }` — LoginPage displays `error.message` in a `<Alert variant="destructive">` which renders as `role="alert"`.

**Why:** These patterns are load-bearing for the fixture design and any future test that needs auth.
**How to apply:** Always import `test` from `./fixtures/auth.js` when a test needs `adminPage` or `agentPage`. Use `{ page }` for unauthenticated tests from the same extended test object.

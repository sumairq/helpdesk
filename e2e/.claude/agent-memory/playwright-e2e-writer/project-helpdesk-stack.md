---
name: Helpdesk app stack and e2e layout
description: Tech stack, ports, monorepo structure, test DB setup, and key scripts for the Helpdesk e2e suite
type: project
---

Monorepo at C:\Users\sumair\Desktop\helpdesk\ with npm workspaces: `client/` (React+Vite, :5173) and `server/` (Express, :3001). Vite proxies `/api` → `:3001`.

**Auth:** Better Auth v1.6.9, email+password, `disableSignUp: true`. Public signup is intentionally disabled — users are seeded.

**Roles:** `ADMIN` and `AGENT` (Prisma enum). Admin is seeded via `server/src/seed.ts`. Agent is seeded via `server/src/seed-agent.ts` (added for e2e tests).

**Test DB lifecycle:**
- `global-setup.ts` calls `npm run db:reset:test --workspace server` then `npm run seed:test --workspace server`.
- Test credentials live in `server/.env.test` (SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD).
- DB reset happens once per test run (not per file).

**Key e2e commands:**
- `npm run test:e2e` — full suite via `playwright test`
- `npm run test:e2e:ui` — interactive UI mode
- `npx tsc --noEmit --project e2e/tsconfig.json` — typecheck e2e files

**Rate limit:** `customRules["/sign-in/email"] = { window: 60, max: 5 }`, in-memory, per-IP. All tests share localhost IP so real exhaustion would break the suite.

**Why:** Tracking this because auth and rate-limit design have significant test isolation implications.
**How to apply:** Always design sign-in tests to either use valid credentials or mock the server response. Never exhaust the real rate-limit bucket.

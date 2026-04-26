---
name: Rate-limit test design decision — mock don't exhaust
description: Why rate-limit tests use page.route() mocks instead of real exhaustion attempts
type: feedback
---

Use `page.route("**/api/auth/sign-in/email", ...)` to return synthetic 429 responses when testing rate-limit UI behaviour. Do NOT make real failed sign-in attempts to exhaust the server's rate-limit bucket.

**Why:** Better Auth's rate limit for `/sign-in/email` is `{ window: 60, max: 5 }` per-IP, stored in-memory on the server process. All e2e tests share the same `localhost` IP. Exhausting the real budget in one test (using wrong credentials) consumes budget shared by every other test that calls the sign-in endpoint — including the `adminPage` fixture and session persistence tests. This would cause cascading failures across the entire suite within a 60-second window.

**How to apply:** Any test that wants to assert 429 behaviour should intercept with `page.route()` and `route.fulfill({ status: 429, ... })`. Real rate-limit enforcement (the server actually blocking a 6th request) belongs in a server-level integration test with its own isolated in-memory state.

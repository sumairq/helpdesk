# Playwright E2E Writer — Agent Memory

- [Project: Helpdesk app stack and e2e layout](project-helpdesk-stack.md) — monorepo, React+Vite :5173, Express :3001, Better Auth, Prisma/PostgreSQL
- [Auth: Better Auth test patterns](auth-patterns.md) — sign-in endpoint, storageState fixtures, admin plugin absent, agent seeding via Prisma
- [Locators: shadcn base-nova UI patterns](locators-shadcn.md) — getByLabel works for inputs, CardTitle is a div not heading, Alert has role="alert"
- [Feedback: rate-limit test design](feedback-rate-limit.md) — mock 429 via page.route(); do NOT exhaust real bucket (shared IP)

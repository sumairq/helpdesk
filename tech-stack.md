# Tech Stack

## Frontend
- **Next.js (App Router) + React + TypeScript** — server components for dashboard/ticket lists
- **Tailwind CSS + shadcn/ui** — admin UI components
- **TanStack Query** — client-side data fetching, filtering, sorting

## Backend
- **Express + TypeScript** — REST API server
- **Prisma** — ORM
- **PostgreSQL** — primary datastore (tickets, users, categories, audit log)
- **pgvector** extension — knowledgebase embeddings stored alongside relational data

## Authentication
- **Database-backed sessions** — session records stored in PostgreSQL, session ID issued via secure HTTP-only cookie
  - `express-session` with `connect-pg-simple` as the session store
  - Passwords hashed with `argon2` (or `bcrypt`)
- Admin account seeded on first deploy; admin invites additional agents

## AI
- **Claude API** via the Anthropic TypeScript SDK
  - `claude-sonnet-4-6` — summaries, suggested replies
  - `claude-haiku-4-5` — high-volume classification
- **Prompt caching** on the system prompt + knowledgebase content (large reuse across tickets)

## Email
- **Postmark** (or SendGrid Inbound Parse) — inbound email via webhook to Express; outbound replies with proper `Message-ID` / `In-Reply-To` threading

## Background jobs
- **BullMQ** (Redis-backed) — async AI classification, embedding generation, auto-reply drafting
  - Keeps the inbound-email webhook fast
  - Built-in retries and observability

## Infrastructure
- **Hosting:** Vercel (frontend) + Fly.io / Railway / Render (Express + Redis)
- **Database:** Neon or Supabase (Postgres with pgvector)
- **Errors/logs:** Sentry + structured logs (pino)

# Helpdesk

AI-powered ticket management system. See `project-scope.md`, `tech-stack.md`, and `implementation-plan.md`.

## Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL (later phases)

## Setup

```bash
npm install
cp server/.env.example server/.env
```

## Run dev servers

```bash
npm run dev          # both client and server in parallel
npm run dev:server   # server only on http://localhost:3001
npm run dev:client   # client only on http://localhost:5173
```

The Vite dev server proxies `/api/*` to the Express server.

## Layout

- `server/` — Express + TypeScript API (run via `tsx`)
- `client/` — React + TypeScript (Vite)

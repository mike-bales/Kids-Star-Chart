# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start both client (Vite :5173) and server (Express :3001) concurrently
npm run build        # Production build: client first, then server
npm start            # Run production server (serves API + static client)

npm run dev -w server    # Server only (tsx watch, hot-reload)
npm run dev -w client    # Client only (Vite dev server)
npm run build -w client  # Build client only (tsc + vite build)
npm run build -w server  # Build server only (tsc)
```

Type-check without emitting: `npx -w client tsc --noEmit` / `npx -w server tsc --noEmit`

Docker: `docker compose up -d` (builds and runs production image on port 3001)

## Architecture

**Monorepo** using npm workspaces with two packages: `client/` and `server/`.

### Server (`server/src/`)
- **Express + better-sqlite3 + TypeScript** on port 3001
- Direct SQL queries with prepared statements (no ORM)
- SQLite database at `server/data/starchart.db` (WAL mode, foreign keys enabled)
- Schema defined in `db/schema.sql`, auto-applied on startup by `db/database.ts`
- Default settings seeded on first run (PIN: 1234, threshold: 20 stars = $10)
- Routes in `routes/` — each file is a Router mounted in `index.ts`
- PIN auth via `X-Parent-Pin` header, verified by `middleware/requirePin.ts` (SHA-256 hash)
- Zod validation on all request bodies

### Client (`client/src/`)
- **React 19 + Vite + Tailwind CSS v4 + TypeScript**
- Routing: react-router-dom v6 — routes defined in `App.tsx`
- Data fetching: TanStack Query with 5s staleTime — hooks call `api/client.ts` fetch wrapper
- Auth state: `context/AuthContext.tsx` stores PIN in memory (not persisted), auto-includes in API calls
- Sounds: Howler.js (`lib/sounds.ts`), files in `public/sounds/`
- Confetti: canvas-confetti (`lib/confetti.ts`)
- Vite dev server proxies `/api` → `http://localhost:3001`

### Auth Model
Two access levels, not role-based — just "has PIN" or "doesn't":
- **Public** (kids): view children, view tasks, award stars, view history/insights
- **PIN-protected** (parents): CRUD children/tasks, undo stars, payouts, settings

### Data Model
Five tables: `children`, `tasks`, `star_logs`, `payouts`, `settings`. Children and tasks use soft deletes (`deleted_at`). Star totals are always computed from `star_logs` (never denormalized). Undo sets `undone_at` on the original log entry.

### Production Deployment
In production (`NODE_ENV=production`), Express serves the built Vite client via `express.static` from `client/dist/`. Single process, single port. Dockerfile uses multi-stage build. Data persists via Docker volume at `/app/server/data`.

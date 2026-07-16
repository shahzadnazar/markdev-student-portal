# MarkDev — Student Portal

**Learn • Build • Grow**

The React student-facing application of the MarkDev Learning Management System. It is a pure API client: every piece of data comes from the Laravel backend (`markdev-admin-api`) through versioned REST endpoints under `/api/v1/*` — no mock data anywhere.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 + TypeScript (strict) |
| Build | Vite |
| Styling | TailwindCSS v4 (design tokens in `src/index.css`) |
| Components | Shadcn-style primitives on Radix UI |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Motion | Framer Motion |
| Charts | Recharts |
| HTTP | Axios (Sanctum bearer tokens) |

## Getting started

```bash
cp .env.example .env   # point VITE_API_URL at the Laravel backend
npm install
npm run dev            # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (proxies `/api` to the backend) |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript project check |
| `npm run preview` | Preview the production build |

## Architecture

```
src/
├── api/
│   ├── client.ts             # Axios instance, auth header, error normalization
│   └── repositories/         # Repository pattern — ALL endpoint calls live here
├── hooks/                    # TanStack Query hooks wrapping the repositories
├── types/                    # API contract types (single source of truth)
├── lib/                      # query client, query-key factory, formatting, storage
├── context/auth-context.tsx  # Sanctum session, remember-me, role/permission checks
├── routes/                   # Route table, guards, path helpers
├── components/
│   ├── ui/                   # Design-system primitives (button, card, dialog…)
│   ├── layout/               # App shell: sidebar, topbar, auth layout
│   └── shared/               # Cross-feature building blocks
└── pages/                    # One folder per feature
```

**Data flow:** page → hook (`src/hooks`) → repository (`src/api/repositories`) → `apiClient` → Laravel. Components never call Axios directly, and cache keys come only from the `qk` factory in `src/lib/query-keys.ts`.

**Auth:** token-based Laravel Sanctum. "Remember me" picks the token store (localStorage vs sessionStorage). A 401 from any endpoint clears the session and returns the user to `/login`. Role/permission checks are available via `useAuth().hasRole/can` and mirror Spatie permission names served by the API.

## Features

Dashboard · Course catalog & details · Lesson player (video/article/resources/discussion) · Assignments & submissions · Quizzes (timed attempts, results review) · Certificates · Attendance · Progress analytics · Leaderboard · Announcements · Notifications · Bookmarks · Global search · Calendar · Profile · Settings · Help center — plus login, forgot/reset password, and change password.

## Design system

Implemented from `docs/DESIGN.md` (MarkDev brand):

- **Colors** — Deep Ocean Blue `#0C5ABD` (primary actions), Accent Purple `#6B53C4` (secondary/progress), Surface Ice `#F5F9FF` background, near-black `#1A1C1E` text.
- **Type** — Hanken Grotesk (display), Inter (body), JetBrains Mono (labels/metadata).
- **Shape** — 8px radius controls, 16px radius cards; buttons are never pill-shaped.
- **Elevation** — primary-tinted ambient shadows (`shadow-card`, `shadow-elevated`).
- **Layout** — 280px white sidebar, fluid content column capped at 1440px, 8px spacing rhythm, 24px card padding.

The backend API contract this app consumes is documented in [`docs/API.md`](docs/API.md).

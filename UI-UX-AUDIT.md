# UI/UX Audit — MarkDev LMS (Student Portal + Admin Portal)

Date: 2026-07-25 · Scope: `markdev-student-portal` (React 19 + Tailwind v4) and `markdev-admin-api` (Laravel 12 Blade + Alpine.js + Tailwind v4).
Method: full-codebase inspection of both frontends (layouts, routes, shared components, states, accessibility, responsiveness), every finding verified against file:line.

Severity scale: **Critical** (breaks usability/accessibility or shows wrong data) · **High** (materially hurts daily operation) · **Medium** (inconsistency/debt that compounds) · **Low** (polish).

Overall assessment: both portals already share one design language (brand blue `#0C5ABD`, tokenized type scale, shared component kits that are genuinely used) and have near-complete loading/empty/error coverage. This audit therefore focuses on the gaps: accessibility of focus/drawers, a handful of remaining marketing-style sections, status-map duplication, and missing primitives (Table, ConfirmDialog, Breadcrumbs).

---

## Part A — Student Portal (`markdev-student-portal`)

Inventory: 28 route pages, 24 `src/components/ui/*` primitives, 7 `src/components/shared/*` components, 5 layout files. Toasts (sonner) mounted globally in `App.tsx`; Radix dialogs/menus/tooltips in place.

### A1. Layout & shell

| Sev | Finding | Where |
| --- | --- | --- |
| High | Mobile nav drawer is a hand-rolled `motion.div` — no `role="dialog"`, no focus trap, no Escape | `app-shell.tsx:40-48` |
| High | No breadcrumbs anywhere; deep routes (`/courses/:id/lessons/:id`, `/quizzes/:id/results/:attemptId`, …) have no trail | shell-wide |
| Medium | No desktop sidebar collapse; fixed 280 px (`--spacing-sidebar`) always consumed | `index.css:128`, `sidebar.tsx:82-88` |
| Low | No bottom navigation on mobile; hamburger drawer is the only path to 15 destinations | `topbar.tsx:47-55` |

### A2. Pages

| Sev | Finding | Where |
| --- | --- | --- |
| High | Profile page renders `null` while loading — the only page with no loading/empty/error state | `profile-page.tsx:55` |
| Medium | Dashboard greeting oversized (40 px + marketing line "keep the momentum going") | `dashboard-page.tsx:39-51` |
| Medium | Payments hero banner has decorative sheen gradient + watermark icon (marketing pattern) | `payments-page.tsx:126-137` |
| Medium | Auth layout is a marketing splash: `p-12` gradient panel, `blur-3xl` glow orbs, benefit bullets | `auth-layout.tsx:5-25,51` |
| Medium | Two pages bypass `PageHeader` and hand-roll headers (dashboard, help-article) | `dashboard-page.tsx`, `help-article-page.tsx` |
| Low | Three competing title sizes: `headline-xl` metrics in page bodies vs `headline-md` titles | `quiz-result-page.tsx:136`, `assignment-detail-page.tsx:538`, `quiz-detail-page.tsx:250` |
| Low | Ad-hoc `mb-8` section spacing in 8 files vs `mb-5/6` elsewhere | dashboard, attendance, courses, search, quiz pages |

### A3. Shared kit gaps

Present and used: Button (primary/secondary/ghost/success/destructive/link × sm/md/lg/icon), Badge (7 variants), Alert (4 variants), Card family, Dialog, DropdownMenu, Tooltip, Tabs, Select, Pagination (`PaginationBar` with result counts), Skeleton, Spinner, EmptyState, ErrorState, FormField, StatCard, PageHeader.

| Sev | Missing | Impact |
| --- | --- | --- |
| High | `Table` primitive | raw `<table>` duplicated (`leaderboard-table.tsx:65`, `transactions-card.tsx:136`) with divergent header classes |
| High | `ConfirmDialog` | destructive actions fire with no confirmation (`bookmarks-page.tsx:203`, logout `topbar.tsx:118`) |
| Medium | Toast wrapper | `sonner` imported directly in 14 files, inline styling at `App.tsx:12-20` |
| Medium | `warning` Button variant | amber tokens exist; Badge/Alert/StatCard have warning variants, Button does not |
| Medium | `Drawer` primitive | mobile nav hand-rolled; lesson rail misuses Dialog |
| Low | `Breadcrumbs`, `StickyFormActions`, `Accordion`, `StatusBadge` registry | see A4/A1 |

### A4. Consistency

| Sev | Finding | Where |
| --- | --- | --- |
| **Critical** | Same invoice status renders differently: `open` → "Active" in the list but "Open" in the detail dialog | `invoices-card.tsx:23` vs `invoice-dialog.tsx:15` |
| Medium | Status→badge maps duplicated in 5 files (attendance ×2, quiz, transactions, invoices, invoice-dialog) | see files above |
| Medium | Token bypass: raw Tailwind type scale (`text-base`/`text-sm`) in attendance (6×) and payments (3×) | `attendance-page.tsx:187-189`, `payments-page.tsx:191-193` |
| Medium | Seven arbitrary sizes below the token floor (`text-[9px]`–`text-[11px]`) | announcements, topbar, brand-mark, calendar, attendance |
| Medium | Chart colors re-typed as hex literals, will drift from tokens | `progress-activity-card.tsx:29-31`, `activity-chart-card.tsx:23-25,120` |
| Medium | `TooltipProvider` mounted locally in one card instead of app root | `transactions-card.tsx:184` |
| Low | Ad-hoc pills/cards instead of `<Badge>`/`<Card>` in 4 spots | payments, certificates, announcements, lesson-sidebar |

### A5. States

Coverage is strong: `ErrorState` in 23 page files, `Skeleton` in 29, `EmptyState` in 22, consistent `disabled={isPending}` + `<Spinner>` submit pattern in 10 files.

| Sev | Finding | Where |
| --- | --- | --- |
| High | Profile page: no states at all (see A2) | `profile-page.tsx:55` |
| Medium | `EmptyState`/`ErrorState`/`PageLoader` hardcode `py-16` (128 px); pages fight it with overrides; empty-state titles same size as page titles | `empty-state.tsx:18,25`, `error-state.tsx:23`, `page-loader.tsx:18` |
| Medium | Inconsistent `aria-hidden` on `Spinner` (double screen-reader announcement) | `login-page.tsx:162` vs `profile-page.tsx:261` |

### A6. Accessibility

| Sev | Finding | Where |
| --- | --- | --- |
| **Critical** | Global focus ring uses `box-shadow`, clipped by 14 `overflow-hidden` containers → keyboard focus invisible inside cards | `index.css:154-159`; e.g. `course-card.tsx:31`, `leaderboard-table.tsx:63` |
| High | Mobile drawer: no focus trap / Escape (see A1) | `app-shell.tsx:40-48` |
| Medium | Touch targets under 40 px: `size="sm"` buttons are 32 px (20 usages), pagination `size-8`, lesson-topbar 36 px | `button.tsx:25`, `pagination.tsx:54-89` |
| Medium | `aria-label` on bare `<span>` status dots (not reliably announced) | `notifications-page.tsx:230`, `announcements-page.tsx:143` |
| Medium | `DropdownMenuItem` removes its focus ring, relies on low-contrast bg tint | `dropdown-menu.tsx:37` |
| Low | Strengths to preserve: all 19 icon buttons have `aria-label`; zero placeholder-only inputs; `scope="col"` + `sr-only` captions on tables; Radix dialogs trap focus correctly | — |

### A7. Tokens & typography

`@theme` defines fonts (Hanken Grotesk / Inter / JetBrains Mono), a full M3-style color ramp incl. success/warning extensions, a 9-step paired type scale, 2 shadows, layout tokens.

| Sev | Finding |
| --- | --- |
| Medium | No `--radius-*` tokens — radii hardcoded per component (`rounded-lg` button, `rounded-2xl` card, `rounded-xl` alert) |
| Medium | No dark-mode block despite complete `on-*`/`inverse-*` sets |
| Low | No motion/duration tokens; framer timings re-declared inline in ~20 files |

### A8. Responsive

| Sev | Finding | Where |
| --- | --- | --- |
| Medium | Payments hero `<dl class="flex gap-8">` with two currency headlines squeezes/overflows at ~360 px | `payments-page.tsx:167-183` |
| Medium | Leaderboard is the only list with no mobile fallback (`min-w-[36rem]` + horizontal scroll) | `leaderboard-table.tsx:64-65` |
| Low | Attendance register is a CSS-grid pseudo-table with `aria-hidden` header and per-breakpoint duplicated badges | `attendance-page.tsx:371-478` |
| Low | Courses/assignments/quizzes handle mobile well (responsive filters, scrollable tab strips) | — |

### A9. Tables, lists, pagination

| Sev | Finding | Where |
| --- | --- | --- |
| Medium | Three renderings for the same job: real table / grid pseudo-table / card lists | leaderboard, attendance, everything else |
| Medium | Result counts duplicated: `PaginationBar` renders "Showing X–Y of N" AND four pages hand-roll a second count | `courses-page.tsx:244`, `assignments-page.tsx:170`, `quizzes-page.tsx:174`, `attendance-page.tsx:360` |
| Medium | `PaginationBar` returns `null` when single page → total count disappears | `pagination.tsx:39` |
| Low | Pagination otherwise a strength: 1 component, 11 usages, `aria-current`, labelled prev/next | — |

---

## Part B — Admin Portal (`markdev-admin-api`)

*(see continuation below — compiled from the admin-side inspection)*

---

## Classification summary & remediation plan

*(see end of document)*

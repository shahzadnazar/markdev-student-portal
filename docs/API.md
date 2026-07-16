# MarkDev Student Portal — API Contract

Every endpoint the portal consumes, to be implemented by the Laravel backend (`markdev-admin-api`). All routes are prefixed `/api/v1` and, except where noted, require `Authorization: Bearer <sanctum token>`.

Conventions:

- Single resources are wrapped in `{ "data": { … } }` (Laravel API Resources).
- Collections marked *paginated* use Laravel's paginator envelope: `{ data: [...], meta: { current_page, last_page, per_page, total, from, to }, links: { first, last, prev, next } }` and accept `page`, `per_page`, `search`, `sort`.
- Validation failures return `422` with `{ message, errors: { field: [msg] } }`.
- Field shapes are defined by the TypeScript types in [`src/types/`](../src/types) — that folder is the normative contract.

## Auth (guest routes)

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password, remember }` → `{ data: { token, user } }` |
| POST | `/auth/forgot-password` | `{ email }` → `{ data: { message } }` |
| POST | `/auth/reset-password` | `{ email, token, password, password_confirmation }` |

## Auth (authenticated)

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/auth/logout` | Revokes the current token |
| GET | `/auth/me` | Current user with `roles[]` and `permissions[]` (Spatie names) |
| PUT | `/auth/password` | `{ current_password, password, password_confirmation }` |
| PUT | `/auth/profile` | `{ name, phone?, bio?, headline? }` → updated user |
| POST | `/auth/avatar` | multipart `avatar` file → updated user |

## Catalog

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/courses` | *paginated*; filters: `category` (slug), `level`, `enrolled` (bool) |
| GET | `/courses/{course}` | Course detail incl. `is_enrolled`, `enrollment`, `is_bookmarked` |
| GET | `/courses/{course}/modules` | Modules with nested lesson summaries (incl. `is_completed`) |
| POST | `/courses/{course}/enroll` | Creates the enrollment |
| GET | `/categories` | All course categories |
| GET | `/courses/{course}/lessons/{lesson}` | Lesson detail: video, content, resources, prev/next ids |
| POST | `/courses/{course}/lessons/{lesson}/complete` | Marks complete → `{ data: { progress_percent } }` |
| DELETE | `/courses/{course}/lessons/{lesson}/complete` | Unmarks |
| GET | `/lessons/{lesson}/comments` | Discussion thread (one nesting level) |
| POST | `/lessons/{lesson}/comments` | `{ body, parent_id? }` |

## Assessments

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/assignments` | *paginated*; filters: `status`, `course_id` |
| GET | `/assignments/{assignment}` | Includes the student's `submission` when present |
| POST | `/assignments/{assignment}/submissions` | multipart: `content?`, `file?` |
| GET | `/quizzes` | *paginated*; filters: `status`, `course_id` |
| GET | `/quizzes/{quiz}` | Quiz meta incl. `attempts_used`, `best_score`, `status` |
| POST | `/quizzes/{quiz}/attempts` | Starts/resumes an attempt → questions **without** correct answers, plus `expires_at` when timed |
| POST | `/quizzes/{quiz}/attempts/{attempt}/submit` | `{ answers: [{ question_id, selected_option_ids?, answer_text? }] }` → full result |
| GET | `/quizzes/{quiz}/attempts` | The student's finished attempts (results list) |
| GET | `/quizzes/{quiz}/attempts/{attempt}` | One graded result with per-question breakdown |

## Engagement

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/dashboard` | Aggregated stats, continue-learning, upcoming events, activity series |
| GET | `/attendance` | *paginated*; filters: `course_id`, `from`, `to`, `status` |
| GET | `/attendance/summary` | Counts + `attendance_rate` |
| GET | `/certificates` | Issued certificates with `download_url` |
| GET | `/progress` | Overview + per-course progress |
| GET | `/leaderboard?period=weekly\|monthly\|all_time` | Entries + the caller's own row |
| GET | `/announcements` | *paginated*; `course_id?`; pinned first |
| GET | `/announcements/{id}` | — |
| POST | `/announcements/{id}/read` | — |
| GET | `/notifications` | *paginated*; `unread?` (Laravel database notifications) |
| GET | `/notifications/counts` | `{ data: { unread } }` |
| PATCH | `/notifications/{id}/read` | — |
| POST | `/notifications/read-all` | — |
| DELETE | `/notifications/{id}` | — |
| GET | `/bookmarks` | *paginated*; `type?` = `course` \| `lesson` |
| POST | `/bookmarks` | `{ type, id }` |
| DELETE | `/bookmarks/{type}/{id}` | Delete by target |
| GET | `/calendar?from=&to=` | Events (assignment/quiz due dates, live sessions) in range |
| GET | `/search?q=` | Grouped results: courses, lessons, assignments, quizzes, announcements |
| GET | `/help/categories` | — |
| GET | `/help/articles` | *paginated*; `category?` (slug) |
| GET | `/help/articles/{slug}` | Article with HTML `body` |
| GET | `/help/faqs` | — |
| GET | `/settings` | Timezone, language, notification preferences |
| PUT | `/settings` | Partial update of the same shape |

## Billing & payments (student-facing)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/billing` | Account overview: plan title, billing cycle/active flag, currency, `total_amount`, `paid_amount`, `remaining_amount`, `paid_percent`, `next_due_at`, `next_invoice`, `statement_url` (PDF) |
| GET | `/billing/transactions` | *paginated*; filters: `status` (`success`\|`pending`\|`failed`\|`refunded`), `from`, `to`. Each row: `reference` (e.g. TRX-99201), method (`card`/`bank_transfer`/`wallet`/`cash`/`other` + pre-rendered label like "Visa •••• 4242"), amount, currency, status, `receipt_url` |
| GET | `/billing/invoices` | *paginated*; `status?` (`open`\|`paid`\|`past_due`\|`void`); rows include `number`, amount, due/paid dates, `download_url` |
| POST | `/billing/invoices/{invoice}/pay` | Starts payment → `{ data: { checkout_url, transaction } }`. `checkout_url` set → the portal redirects to the hosted checkout; `transaction` set → settled immediately (e.g. wallet/manual) |
| POST | `/billing/transactions/{transaction}/retry` | Retries a **failed** transaction; same response shape as pay |

Payment-provider webhooks, fee-plan assignment, manual payment recording, refunds, and invoice CRUD are **admin-side** concerns in `markdev-admin-api` (Blade admin): admins manage fee plans per student/course, issue invoices, record offline payments (cash/bank transfer), issue refunds, and export statements — all audit-logged like every other module. The student portal only consumes the read/pay endpoints above.

## Cross-cutting expectations

- **401** on any endpoint logs the student out client-side; tokens are Sanctum personal access tokens.
- Timestamps are ISO-8601 strings (UTC).
- HTML fields (`lesson.content`, `assignment.instructions`, `help_article.body`, `announcement.body`) are rendered as trusted rich text — the backend must sanitize them.
- File uploads (`avatar`, assignment `file`) are multipart; limits/validation are backend-enforced and surfaced through `422` errors.

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
| GET | `/attendance/daily` | *paginated*; the academy's daily register for the student — `{date, status: present|late|absent|leave, remarks, source: manual|biometric, marked_at, corrected}` |
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
| POST | `/billing/invoices/{invoice}/submissions` | Student uploads proof of payment (multipart: `payment_method_id` **or** legacy `channel`, `payer_name`, `reference_no`, `payment_date`, `notes?`, `receipt` file ≤5MB). Creates a **pending** transaction, sets the invoice to **pending**, and notifies billing admins. Blocked (422) while a submission is already under review or the invoice is paid/void |

**Monthly installments:** a plan may be split into monthly invoices generated from the admission date, all due on a chosen day of the month. Each invoice is `upcoming` (hidden from payment) until `activation_days` before its due date, then `open`; after the due date a grace window applies, and once it ends the invoice becomes `past_due` with a per-day defaulter fine accruing (`fine_amount`/`fine_days`) — students pay `payable_total` (amount + fine). Invoices expose `sequence_no`, `activates_at`, `in_grace`, `days_overdue`; the overview exposes an `installments` object (months, due_day, fine_per_day, grace_days, activation_days, paid_count, defaulted_fine_total). A daily `billing:sweep` on the backend handles activation, grace warnings, defaulting, fine accrual and student notifications.

**Fee verification flow:** submissions start `pending`; an admin reviews the receipt in the Fee Review screen and either **approves** (transaction `success`, invoice `paid`, student notified) or **rejects with a required reason** (transaction `rejected`, invoice back to `open`/`past_due`, student notified with the reason and may resubmit). Invoice statuses: `open | pending | paid | past_due | void`; transaction statuses: `pending | success | rejected | failed | refunded`. Invoices expose `latest_submission`; the overview exposes `pending_review_amount`, `pending_invoice`, `payment_channels`, and `support_phone`.

**Payment methods:** admins configure real payout accounts (JazzCash, EasyPaisa, SadaPay, bank …) with `account_title`, `account_number`, optional `bank_name`/`instructions`, and can attach them to specific courses (a method with no courses is offered for every course). The overview exposes `payment_methods` scoped to the plan's course — the pay dialog lists them and shows the selected account's title/number/instructions so the student knows exactly where to send the money; the chosen `payment_method_id` is recorded on the transaction.

**Admission billing:** invoices carry a `type` (`installment` or `registration`). At admission the academy collects a one-time registration fee (settings default, per-admission override, 0 = waived) plus the **first installment in advance** — both invoices are due on the admission day itself; the remaining installments follow the monthly due-day cycle. The first installment amount may differ from the equal split (the remainder divides equally over the remaining months), and admins can later adjust any unpaid installment's amount, optionally spreading the difference across the later unpaid installments. Plan progress (`paid_count`, `paid_amount`, `remaining_amount`) counts `installment` invoices only.

Fee-plan assignment, manual payment recording, refunds, and invoice CRUD are **admin-side** concerns in `markdev-admin-api` (Blade admin): admins manage fee plans per student/course, issue invoices, record offline payments (cash/bank transfer), issue refunds, and export statements — all audit-logged like every other module. The student portal only consumes the read/pay endpoints above.

## Cross-cutting expectations

- **401** on any endpoint logs the student out client-side; tokens are Sanctum personal access tokens.
- Timestamps are ISO-8601 strings (UTC).
- HTML fields (`lesson.content`, `assignment.instructions`, `help_article.body`, `announcement.body`) are rendered as trusted rich text — the backend must sanitize them.
- File uploads (`avatar`, assignment `file`) are multipart; limits/validation are backend-enforced and surfaced through `422` errors.

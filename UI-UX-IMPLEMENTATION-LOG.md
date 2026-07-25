# UI/UX Implementation Log — MarkDev LMS

Running checkpoint record for the phased implementation approved on top of `UI-UX-AUDIT.md` / `DESIGN-SYSTEM.md`. Each checkpoint records scope, files, validation, and commit.

---

## Checkpoint 0 — Audit + Phase 1 foundations (previous session)

- Delivered `UI-UX-AUDIT.md` (3 Critical / 21 High / 38 Medium / 22 Low) and `DESIGN-SYSTEM.md`.
- Foundations shipped: outline-based focus rings (both apps), Radix-dialog mobile drawer, shared billing status registry (fixed "Active"/"Open" mismatch), warning button variant (portal), submit-once guard + required asterisks + success confirm variant + 9 labelled row actions (admin), `text-label-md` token defined, dead CSS removed.
- Validation: portal tsc+build clean; admin 195/195 tests; browser checks (focus outline compiled, drawer role/Escape) green.
- Commits: portal `Design-system foundations (Phase 1, student portal)`, admin `Design-system foundations (Phase 1, admin portal)`.

## Checkpoint 1 — Approved brand palette migration (Phase 2 entry)

**Directive:** replace `#0C5ABD` with the approved palette (`primary-600 #124389` main, `700 #0F376F` hover, `500 #1D5AA6` bright, `100 #DCE9F7` container, `50 #EEF4FB` canvas, accent `#1FBBEB`). Token-level migration only — no per-screen edits.

**Changed (portal):** `src/index.css` `@theme` primary ramp + surface-ice + shadows + brand gradient; `App.tsx` toast shadow → `var(--shadow-elevated)`; new `lib/css-token.ts` so the two chart files read `--color-primary` at runtime instead of hex literals (closes audit A4 chart-drift finding).
**Changed (admin):** `resources/css/app.css` `@theme` (primary/deep/surface-ice/shadows + new `--color-primary-bright`, `--color-accent`); inline-SVG dashboard charts ×2, brand-mark gradient, and the two DomPDF stylesheets updated to the new hex (PDFs cannot read CSS vars); dead v3 `tailwind.config.js` deleted (unreferenced; contradicted the v4 CSS pipeline).

**WCAG verification (computed):**
| Pair | Ratio |
| --- | --- |
| `#124389` on white / white on `#124389` | 9.59:1 ✓ |
| white on `#0F376F` (hover) | 11.69:1 ✓ |
| `#1D5AA6` on white | 6.85:1 ✓ |
| body text on `#EEF4FB` canvas | 15.44:1 ✓ |
| `#0F376F` on `#DCE9F7` container | 9.49:1 ✓ |
| accent `#1FBBEB` on white | 2.24:1 — **decorative use only**, never filled buttons with white text (matches directive) |

No screen required rejecting the approved colour; focus rings, hover states and disabled states all derive from the tokens and inherit the new values.

**Validation:** portal build ✓ · admin build ✓ · admin tests 195/195 ✓.

*(subsequent checkpoints appended below as phases complete)*

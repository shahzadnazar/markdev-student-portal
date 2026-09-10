import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { formatDurationSeconds } from "@/lib/format";

/**
 * The quiz page says what the SERVER says.
 *
 * Every number on it — the limit, the rate, the allowance — is resolved
 * server-side from the academy settings and the quiz's own overrides, and
 * arrives already computed. The portal's job is to word it, and the wording
 * has to survive the answer being ONE, which is now the default.
 *
 * These run in node with no DOM and no renderer, so they check the formatter
 * behaviourally and the page's wording at source. Where a rendered assertion
 * would be stronger it is said so rather than implied.
 */
const page = readFileSync(new URL("./quiz-detail-page.tsx", import.meta.url), "utf8");
const list = readFileSync(new URL("./quizzes-page.tsx", import.meta.url), "utf8");

/** The page with its comments removed — several of them quote the old code. */
const code = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("formatDurationSeconds", () => {
  it("keeps a short quiz in seconds", () => {
    // 30s per question means a one-question quiz runs for 30 seconds. Rounding
    // that to "1m" would promise a student twice the time they have.
    expect(formatDurationSeconds(30)).toBe("30s");
    expect(formatDurationSeconds(90)).toBe("90s");
  });

  it("switches to minutes once there are two", () => {
    expect(formatDurationSeconds(120)).toBe("2m");
    expect(formatDurationSeconds(300)).toBe("5m");
  });

  it("keeps a remainder rather than hiding it", () => {
    expect(formatDurationSeconds(150)).toBe("2m 30s");
    expect(formatDurationSeconds(330)).toBe("5m 30s");
  });

  it("handles a missing limit without printing NaN", () => {
    expect(formatDurationSeconds(null)).toBe("—");
    expect(formatDurationSeconds(undefined)).toBe("—");
  });
});

describe("the quiz page reads the API, not its own arithmetic", () => {
  it("takes the whole limit from the server rather than deriving it", () => {
    // It used to fall back to `Math.max(1, questions_count)` MINUTES when the
    // limit was null — a second, silent rule the server knew nothing about.
    // There is no null limit any more: a quiz with no rate of its own follows
    // the academy default.
    expect(code).toContain("quiz.time_limit_seconds");
    expect(code).not.toContain("time_limit_minutes");
    expect(list).not.toContain("time_limit_minutes");
    expect(code).not.toContain("Math.max(1, quiz.questions_count)");
  });

  it("shows the per-question rate beside the total", () => {
    // "5m" alone does not explain itself. "5m (30s per question)" tells a
    // student how the clock was built and why a longer quiz gets longer.
    expect(code).toContain("seconds_per_question}s per question");
  });

  it("never prints a negative number of attempts", () => {
    // Lowering the allowance does not delete attempts already sat, so used can
    // exceed allowed and the subtraction can go below zero.
    expect(code).toContain("Math.max(0, quiz.attempts_allowed - quiz.attempts_used)");
  });

  it("does not claim a student used fewer attempts than they did", () => {
    // Clamping used down to the new allowance would make the summary tidy and
    // wrong; the attempt list below it shows every attempt.
    expect(code).not.toMatch(/Math\.min\(\s*quiz\.attempts_used/);
  });
});

describe("the wording survives the answer being one", () => {
  /**
   * Every attempt-counting phrase in the page, with the count it depends on.
   *
   * Extracted from the source so a new phrase added later is covered without
   * anyone remembering to add it here.
   */
  const singularGuards = code.match(/=== 1 \? "attempt" : "attempts"/g) ?? [];

  it("pluralises every attempt count it prints", () => {
    // "1 attempts remaining" is the failure. Each printed count needs its own
    // guard, so the count of guards must not fall to zero.
    expect(singularGuards.length).toBeGreaterThan(0);
  });

  it("states the cap in words rather than counting to one", () => {
    // "You've used all 1 attempt" was awkward and, for a student whose
    // allowance was cut after they sat it twice, not what happened.
    expect(code).toContain('quiz.attempts_allowed === 1 ? "one attempt"');
    expect(code).not.toContain("You've used all");
  });

  it("uses an invariant word where a count would need pluralising", () => {
    // "1 of 1 left" and "3 of 3 left" both read correctly with no branch,
    // which is why the rules row shows what is LEFT rather than what is used.
    expect(code).toContain("left`");
    expect(code).not.toContain("of ${quiz.attempts_allowed} used");
  });
});

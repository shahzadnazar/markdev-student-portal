import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tab-activity telemetry, from the student's side.
 *
 * These run in node with no DOM, so the hook's runtime behaviour — the state
 * machine, the timer, the keepalive fetch — was verified in a real browser
 * instead, and the source guards below are what stop it drifting back. Where
 * a rendered assertion would be stronger, it is said so rather than implied.
 *
 * The load-bearing one is the last block: the student must see nothing, ever,
 * anywhere. That is a property of the whole portal, not of one file, so it is
 * checked by sweeping the source.
 */
const hook = readFileSync(new URL("./use-attempt-activity.ts", import.meta.url), "utf8");
const take = readFileSync(new URL("./quiz-take-page.tsx", import.meta.url), "utf8");

/** Code only — this file's own comments quote the events it must not misuse. */
const code = hook.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the signal", () => {
  it("listens to both visibilitychange and blur/focus", () => {
    // visibilitychange misses a second monitor or an app dragged over the top:
    // the tab is still "visible" for those. blur/focus catches them.
    expect(code).toContain('document.addEventListener("visibilitychange"');
    expect(code).toContain('window.addEventListener("blur"');
    expect(code).toContain('window.addEventListener("focus"');
  });

  it("derives one away state instead of counting the events", () => {
    // A plain tab switch fires BOTH signals. Counting events would make one
    // departure read as two, and a number that inflates is worse than none.
    expect(code).toContain("document.hidden || !document.hasFocus()");
    // No handler may increment on its own — the count moves in one place.
    expect(code.match(/countRef\.current \+= 1/g) ?? []).toHaveLength(2);
    expect(code).toContain("countedRef.current");
  });

  it("ignores absences too short to be a departure", () => {
    // Focus leaves for a moment when a native control takes it — the address
    // bar, a permission prompt. Those are not leaving the quiz.
    expect(code).toContain("MIN_AWAY_MS");
    expect(code).toContain("elapsed < MIN_AWAY_MS");
  });

  it("still records a student who leaves and never returns", () => {
    // Counted on a timer once the absence outlasts the threshold, not on the
    // way back — otherwise closing the tab would erase the departure.
    expect(code).toContain("window.setTimeout");
    expect(code).toContain('window.addEventListener("pagehide"');
  });
});

describe("getting it to the server", () => {
  it("uses fetch keepalive rather than sendBeacon", () => {
    // sendBeacon survives unload but cannot set headers, and this API
    // authenticates with a Bearer token — a beacon would put the credential
    // in the request body. keepalive gives the same survival with headers.
    expect(code).toContain("keepalive: true");
    expect(code).toContain("Authorization: `Bearer ${token}`");
    expect(code).not.toContain("sendBeacon");
  });

  it("sends cumulative totals, never deltas", () => {
    // What makes a retry safe: the server keeps whichever number is larger,
    // so a duplicate changes nothing. Deltas would double-count on exactly
    // the retry that an unloading tab makes likely.
    expect(code).toContain("away_count: countRef.current");
    expect(code).toContain("away_seconds: Math.round(secondsRef.current");
  });

  it("can never break the attempt it is watching", () => {
    // Telemetry. Not awaited, not surfaced, and its failure is swallowed —
    // the quiz submits and scores identically if every request fails.
    expect(code).toContain("void fetch(");
    expect(code).toMatch(/\.catch\(\(\) => \{/);
    expect(code).toContain("try {");
  });

  it("is wired into the take page without returning anything to render", () => {
    expect(take).toContain("useAttemptActivity(quizId,");
    // No state, no destructuring — nothing the page could display.
    expect(take).not.toMatch(/(const|let)\s*[\[{][^\]}]*\]?\}?\s*=\s*useAttemptActivity/);
  });
});

describe("the student sees nothing, anywhere", () => {
  /** Every source file in the portal. */
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts")) files.push(full);
    }
  };
  walk(path.resolve(__dirname, "../.."));

  it("renders no away count or away time in any component", () => {
    // A sweep rather than a check on one page: the requirement is that the
    // number never surfaces to the student, and the way that breaks is
    // someone adding it somewhere else later.
    const offenders = files.filter((file) => {
      const source = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      // The hook writes these keys into a request body, which is the one
      // legitimate mention; anything reading them back is not.
      if (file.endsWith("use-attempt-activity.ts")) return false;
      return /away_count|away_seconds|last_away_at|awayCount|awaySeconds/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it("keeps the away keys out of the portal's own type definitions", () => {
    // If the API ever started sending them, a type would be the first place
    // it showed up — and the second would be a component rendering it.
    const types = readFileSync(path.resolve(__dirname, "../../types/assessments.ts"), "utf8");

    expect(types).not.toMatch(/away_count|away_seconds|last_away_at/);
  });
});

describe("the private-notes promise matches what the server actually does", () => {
  /**
   * A super-admin can read these now (markdev-admin-api), read-only and
   * audited. The wording on screen is the promise the product makes, so it
   * moved in the same change — and this sweeps the whole portal so a copy of
   * the old promise cannot survive in a hint, a heading or an empty state
   * somewhere else.
   */
  const sources = (() => {
    const found: { file: string; text: string }[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts")) {
          // Comments stripped: the card's docblock QUOTES the old promise in
          // order to explain that it changed, and a guard that trips on its
          // own explanation is one people delete. What ships to a student is
          // the JSX and the toast, which survive this.
          found.push({
            file: full,
            text: readFileSync(full, "utf8")
              .replace(/\/\*[\s\S]*?\*\//g, "")
              .replace(/^\s*\/\/.*$/gm, ""),
          });
        }
      }
    };
    walk(path.resolve(__dirname, "../.."));
    return found;
  })();

  it("no longer claims only the student can see them", () => {
    // The exact sentence that was on screen, and the phrasings around it.
    const offenders = sources.filter(({ text }) =>
      /only you can see them|Nobody else can read these|not your classmates, not your instructor/i.test(text),
    );

    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it("does not promise privacy from an admin anywhere", () => {
    const offenders = sources.filter(({ text }) =>
      /(nobody else|no one else)[^.]{0,60}(including|even)[^.]{0,30}admin/i.test(text),
    );

    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it("states the truth where the old promise stood", () => {
    // Same place, same prominence — the card body, not a tooltip.
    const card = readFileSync(
      path.resolve(__dirname, "../lessons/private-notes-card.tsx"),
      "utf8",
    );

    expect(card).toContain("Visible to you and academy administrators");
    // And still says what a student most wants to know: classmates cannot.
    expect(card).toMatch(/classmates and instructors cannot/i);
  });

  it("fixed the docblock too, so the next reader is not misled", () => {
    const card = readFileSync(
      path.resolve(__dirname, "../lessons/private-notes-card.tsx"),
      "utf8",
    );
    const doc = card.slice(0, card.indexOf("export function"));

    expect(doc).toMatch(/academy administrators|super-admin/i);
    expect(doc).not.toMatch(/nobody else can read this/i);
  });
});

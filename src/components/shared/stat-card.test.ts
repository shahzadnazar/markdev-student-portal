import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The stat card leads with the figure.
 *
 * It used to read icon, label, value — so the number a student opened the page
 * for was the last thing they saw. This pins the new order and the handful of
 * decisions that came with it.
 *
 * A source check, because this repo's vitest runs in node with no DOM. What is
 * actually at risk is somebody reordering the JSX back, or reaching for
 * `truncate` on a value that is sometimes a course title — both visible in the
 * source before they are visible in a browser.
 */

const CARD = new URL("./stat-card.tsx", import.meta.url);
const raw = readFileSync(CARD, "utf8");

/** Code only — the component explains every one of these rules in prose. */
const code = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

/** Where each element's JSX starts, so DOM order can be compared. */
function indexOf(needle: string): number {
  const at = code.indexOf(needle);
  expect(at, `expected to find ${needle}`).toBeGreaterThan(-1);
  return at;
}

describe("stat card DOM order", () => {
  it("renders the value, then the label, then the hint", () => {
    const value = indexOf("{value}");
    const label = indexOf("{label}");
    const hint = indexOf("{hint}");

    expect(value).toBeLessThan(label);
    expect(label).toBeLessThan(hint);
  });

  it("puts the icon in the same row as the value, not above the label", () => {
    // Top-right: it keeps the tone colour without competing with the figure.
    const value = indexOf("{value}");
    const icon = indexOf("<Icon");
    const label = indexOf("{label}");

    expect(value).toBeLessThan(icon);
    expect(icon).toBeLessThan(label);
  });
});

describe("the optional parts", () => {
  it("renders no hint element at all when there is no hint", () => {
    expect(code).toMatch(/\{hint \?/);
    expect(code).toMatch(/: null\}/);
  });

  it("renders no icon element at all when there is no icon, leaving no gap", () => {
    // Optional prop, guarded render, and the value on flex-1 so it spans the
    // width rather than leaving a hole where the tile would have been.
    expect(code).toMatch(/icon\?:\s*LucideIcon/);
    expect(code).toMatch(/\{Icon \?/);
    expect(code).toContain("flex-1");
  });
});

describe("typography", () => {
  it("keeps the label's uppercase mono treatment", () => {
    expect(code).toMatch(/font-mono[^"]*text-label-sm[^"]*uppercase/);
  });

  it("gives the value a stronger size than it had, and steps long ones back down", () => {
    // headline-lg for a figure; headline-md — what every value used to be —
    // for a value long enough to be prose, like a course title.
    expect(code).toContain("text-headline-lg");
    expect(code).toContain("text-headline-md");
    expect(code).toMatch(/isLongValue \?/);
  });

  it("wraps a long value instead of truncating it", () => {
    // Half a course title with an ellipsis is less use than two lines.
    expect(code).toContain("break-words");
    expect(code).not.toMatch(/truncate/);
  });
});

describe("reading it aloud", () => {
  it("names the card by its label so the figure is never orphaned", () => {
    // DOM order has to match the visual order, which puts the number first —
    // and "88%" alone means nothing. A group named by the label is announced
    // before its contents are read.
    expect(code).toContain('role="group"');
    expect(code).toContain("aria-labelledby={labelId}");
    expect(code).toMatch(/id=\{labelId\}/);
    expect(code).toContain("useId");
  });
});

describe("the skeletons match", () => {
  const skeletons = [
    ["attendance", new URL("../../pages/attendance/attendance-page.tsx", import.meta.url)],
    ["progress", new URL("../../pages/progress/progress-page.tsx", import.meta.url)],
  ] as const;

  it.each(skeletons)("%s's loading tile uses the new order", (_name, url) => {
    // A skeleton still drawn in the old order would shuffle the card the
    // instant the data arrives.
    const src = readFileSync(url, "utf8");

    expect(src).toContain("items-start justify-between");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { multiSelectState } from "./multi-select";

/**
 * The checkbox dropdown that replaced the portal's single-select filters.
 *
 * The suite runs in node with no DOM and the project has no renderer, so the
 * derived state is tested directly — it is the part with decisions in it —
 * and the wiring is read from the source. Stated plainly rather than dressed
 * up: this proves the three states and the count, not that a click works. The
 * browser run covers that.
 */
describe("multi-select state", () => {
  it("says the placeholder when nothing is ticked", () => {
    const s = multiSelectState(6, 0, "All statuses");

    expect(s.summary).toBe("All statuses");
    expect(s.every).toBe(false);
    expect(s.some).toBe(false);
    expect(s.allChecked).toBe(false);
  });

  it("counts how many of how many when some are ticked", () => {
    const s = multiSelectState(6, 3, "All statuses");

    expect(s.summary).toBe("3 of 6 selected");
  });

  it("is indeterminate when some but not all are ticked", () => {
    // The state the reference behaviour asks for, and the one a plain boolean
    // cannot express. Radix renders it as aria-checked="mixed".
    const s = multiSelectState(6, 1, "Any");

    expect(s.some).toBe(true);
    expect(s.every).toBe(false);
    expect(s.allChecked).toBe("indeterminate");
  });

  it("is fully checked, not indeterminate, when every one is ticked", () => {
    const s = multiSelectState(6, 6, "Any");

    expect(s.every).toBe(true);
    expect(s.some).toBe(false);
    expect(s.allChecked).toBe(true);
    expect(s.summary).toBe("All 6 selected");
  });

  it("does not call an empty option list 'all selected'", () => {
    // 0 of 0 is not everything; a filter with nothing to offer shows its
    // placeholder rather than claiming a full selection.
    const s = multiSelectState(0, 0, "Any");

    expect(s.every).toBe(false);
    expect(s.summary).toBe("Any");
  });
});

describe("multi-select wiring", () => {
  const source = readFileSync(new URL("./multi-select.tsx", import.meta.url), "utf8");

  it("uses the Radix checkbox rather than a styled div", () => {
    expect(source).toContain('from "@/components/ui/checkbox"');
    expect(source).toContain("<Checkbox");
  });

  it("names itself for a screen reader", () => {
    expect(source).toContain("aria-label={label}");
  });

  it("select all ticks and clears every option", () => {
    expect(source).toContain("options.map((o) => o.value)");
  });
});

describe("filters that stayed single-select", () => {
  it("the portal's tab filters are left as tabs", () => {
    // Assignments, quizzes and bookmarks filter with Tabs, which already show
    // an All and read as one choice. Same call as the admin students screen.
    for (const page of ["assignments/assignments-page", "quizzes/quizzes-page", "bookmarks/bookmarks-page"]) {
      const src = readFileSync(new URL(`../../pages/${page}.tsx`, import.meta.url), "utf8");
      expect(src, page).toContain("<Tabs");
      expect(src, page).not.toContain("MultiSelect");
    }
  });

  it("the language setting stays a single select", () => {
    // A setting, not a filter: it has exactly one value by definition.
    const src = readFileSync(new URL("../../pages/settings/settings-page.tsx", import.meta.url), "utf8");

    expect(src).toContain("<Select");
    expect(src).not.toContain("MultiSelect");
  });
});

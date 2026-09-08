import { describe, expect, it } from "vitest";
import { formatDate, formatDateRange, formatDateTime, formatDayLabel } from "./format";

/**
 * Dates read day-first with a named month, everywhere.
 *
 * A student read 08/09/2026 as 8 September and asked for 34 days of leave
 * instead of a few. A numeric date is ambiguous in both directions, so these
 * assert on the month *name* rather than merely on a different digit order.
 */
describe("date formatting", () => {
  /** Anything that could be read as a month/day/year or day/month/year. */
  const NUMERIC_DATE = /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/;

  it("writes a date day-first with a named month", () => {
    expect(formatDate("2026-08-09")).toBe("9 Aug 2026");
    expect(formatDate("2026-09-08")).toBe("8 Sep 2026");
  });

  it("never produces a slash-separated date", () => {
    for (const value of ["2026-08-09", "2026-01-31", "2026-12-01"]) {
      expect(formatDate(value)).not.toMatch(NUMERIC_DATE);
      expect(formatDateTime(`${value}T16:30:00`)).not.toMatch(NUMERIC_DATE);
    }
  });

  it("keeps times 12-hour beside the date", () => {
    expect(formatDateTime("2026-08-09T16:30:00")).toBe("9 Aug 2026 · 4:30 PM");
  });

  it("distinguishes the two readings of an ambiguous pair", () => {
    // The exact pair that caused the bug: these must not render the same, and
    // neither may be mistaken for the other.
    expect(formatDate("2026-08-09")).not.toBe(formatDate("2026-09-08"));
    expect(formatDate("2026-08-09")).toContain("Aug");
    expect(formatDate("2026-09-08")).toContain("Sep");
  });

  it("writes the year once in a same-year range", () => {
    expect(formatDateRange("2026-08-09", "2026-09-11")).toBe("9 Aug – 11 Sep 2026");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("30 Dec 2026 – 2 Jan 2027");
    expect(formatDateRange("2026-08-09", "2026-08-09")).toBe("9 Aug 2026");
  });

  it("falls back to the same pattern for a day label", () => {
    expect(formatDayLabel("2026-08-09")).toBe("9 Aug 2026");
  });
});

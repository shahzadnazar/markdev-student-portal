import { describe, expect, it } from "vitest";
import { classifyDay, leaveCost, monthsSpanned } from "./leave-cost";
import type { LeaveHold } from "./leave-cost";
import type { AcademyCalendar, LeaveBalance } from "@/types";

/**
 * What a picked range costs, and which months a student is told about.
 *
 * The bug this pins: naming only the first short month sent a student to
 * shorten the range to fit September, resubmit, and be refused again by August
 * with no idea why.
 */

/** Mon–Fri, with whatever holidays a case needs. */
function calendar(holidays: Array<{ date: string; name: string }> = []): AcademyCalendar {
  return {
    working_days: [1, 2, 3, 4, 5],
    working_days_label: "Mon–Fri",
    source: "academy",
    slot_name: null,
    holidays,
    from: "2026-08-01",
    to: "2026-12-31",
  };
}

function balance(month: string, label: string, remaining: number): LeaveBalance {
  return {
    allowance: 8,
    used: 8 - remaining,
    remaining,
    month,
    month_label: label,
    resets_on: `${month}-28`,
  };
}

const AUGUST = balance("2026-08", "August 2026", 8);
const SEPTEMBER = balance("2026-09", "September 2026", 8);

describe("leaveCost", () => {
  it("counts only the days the academy is open", () => {
    // Fri 14 Aug to Mon 17 Aug 2026: Sat and Sun are free.
    const cost = leaveCost("2026-08-14", "2026-08-17", calendar(), [AUGUST]);

    expect(cost.chargedDays).toBe(2);
    expect(cost.freeWeekends).toBe(2);
    expect(cost.freeHolidays).toBe(0);
    expect(cost.freeDays.map((day) => day.date)).toEqual(["2026-08-15", "2026-08-16"]);
  });

  it("separates a holiday from a weekend", () => {
    const cost = leaveCost("2026-08-13", "2026-08-17", calendar([{ date: "2026-08-14", name: "Independence Day" }]), [AUGUST]);

    expect(cost.freeHolidays).toBe(1);
    expect(cost.freeWeekends).toBe(2);
    expect(cost.freeDays.find((day) => day.date === "2026-08-14")?.name).toBe("Independence Day");
  });

  it("reports every month a range touches", () => {
    // Mon 24 Aug to Fri 4 Sep 2026: six working days in August (24th–28th and
    // the 31st), four in September.
    const cost = leaveCost("2026-08-24", "2026-09-04", calendar(), [AUGUST, SEPTEMBER]);

    expect(cost.months.map((entry) => entry.label)).toEqual(["August 2026", "September 2026"]);
    expect(cost.months.map((entry) => entry.needed)).toEqual([6, 4]);
  });

  it("names only the short month when the other one fits", () => {
    // September is nearly spent; August has room.
    const cost = leaveCost("2026-08-24", "2026-09-04", calendar(), [
      AUGUST,
      balance("2026-09", "September 2026", 2),
    ]);

    expect(cost.overLimit).toBe(true);
    expect(cost.shortMonths.map((entry) => entry.label)).toEqual(["September 2026"]);
    // August is still listed, so the student can see it is not the problem.
    expect(cost.months).toHaveLength(2);
  });

  it("names both months when both are short", () => {
    const cost = leaveCost("2026-08-24", "2026-09-04", calendar(), [
      balance("2026-08", "August 2026", 1),
      balance("2026-09", "September 2026", 2),
    ]);

    expect(cost.shortMonths.map((entry) => entry.label)).toEqual(["August 2026", "September 2026"]);
  });

  it("names the first month too, not just the last", () => {
    // The failure mode that prompted this: shortening to fit September and
    // being refused again by August.
    const cost = leaveCost("2026-08-24", "2026-09-04", calendar(), [
      balance("2026-08", "August 2026", 1),
      SEPTEMBER,
    ]);

    expect(cost.shortMonths.map((entry) => entry.label)).toEqual(["August 2026"]);
  });

  it("reports one month for a range inside one month", () => {
    const cost = leaveCost("2026-09-14", "2026-09-18", calendar(), [SEPTEMBER]);

    expect(cost.months).toHaveLength(1);
    expect(cost.months[0]!.label).toBe("September 2026");
    expect(cost.overLimit).toBe(false);
  });

  it("does not block a range that fits", () => {
    const cost = leaveCost("2026-09-14", "2026-09-16", calendar(), [SEPTEMBER]);

    expect(cost.chargedDays).toBe(3);
    expect(cost.overLimit).toBe(false);
    expect(cost.shortMonths).toEqual([]);
  });

  it("blocks a range that exceeds the month's remaining balance", () => {
    const cost = leaveCost("2026-09-14", "2026-09-25", calendar(), [
      balance("2026-09", "September 2026", 3),
    ]);

    expect(cost.overLimit).toBe(true);
  });

  it("passes no verdict on a month the server sent no balance for", () => {
    const cost = leaveCost("2026-09-14", "2026-09-18", calendar(), []);

    expect(cost.months[0]!.balance).toBeNull();
    expect(cost.months[0]!.short).toBe(false);
    // Silence is not a block: the server is the one that refuses.
    expect(cost.overLimit).toBe(false);
  });

  it("counts every day until the calendar arrives", () => {
    // Over-counting warns about a range the server would take, which the
    // student can recover from; under-counting sends one it refuses.
    const cost = leaveCost("2026-08-14", "2026-08-17", null, [AUGUST]);

    expect(cost.chargedDays).toBe(4);
    expect(cost.freeDays).toEqual([]);
  });

  it("costs nothing for a range with no dates", () => {
    expect(leaveCost("", "", calendar(), []).chargedDays).toBe(0);
    // A backwards range is not a range.
    expect(leaveCost("2026-09-18", "2026-09-14", calendar(), []).months).toEqual([]);
  });
});

/**
 * What the calendar draws, and what the summary counts, are one answer.
 *
 * Nothing here writes a weekend or a holiday date: the working week and the
 * holidays are the API's, so an academy open on Saturdays is classified from
 * what it sent rather than from an assumption in the portal.
 */
describe("classifyDay", () => {
  const EID = { date: "2026-09-17", name: "Eid ul-Fitr" };

  it("names a holiday and marks it free", () => {
    const facts = classifyDay("2026-09-17", calendar([EID]));

    expect(facts.kind).toBe("holiday");
    expect(facts.holidayName).toBe("Eid ul-Fitr");
  });

  it("keeps a weekend distinct from a holiday", () => {
    // 19 Sep 2026 is a Saturday, outside a Mon–Fri week.
    const weekend = classifyDay("2026-09-19", calendar([EID]));

    expect(weekend.kind).toBe("non-working");
    expect(weekend.holidayName).toBeNull();
    expect(weekend.kind).not.toBe(classifyDay("2026-09-17", calendar([EID])).kind);
  });

  it("follows the academy's own week rather than assuming Sat and Sun", () => {
    const openSaturdays: ReturnType<typeof calendar> = {
      ...calendar(),
      working_days: [1, 2, 3, 4, 5, 6],
    };

    expect(classifyDay("2026-09-19", openSaturdays).kind).toBe("working");
    // Sunday is still closed for that academy.
    expect(classifyDay("2026-09-20", openSaturdays).kind).toBe("non-working");
  });

  it("marks a day another application already holds", () => {
    const holds = new Map<string, LeaveHold>([
      ["2026-09-14", "approved"],
      ["2026-09-15", "pending"],
    ]);

    expect(classifyDay("2026-09-14", calendar(), holds).kind).toBe("on-leave");
    expect(classifyDay("2026-09-15", calendar(), holds).leaveStatus).toBe("pending");
    expect(classifyDay("2026-09-16", calendar(), holds).kind).toBe("working");
  });

  it("does not let a hold turn a free day into a used one", () => {
    // A weekend the student happens to have applied for is still a weekend:
    // it costs nothing either way.
    const holds = new Map<string, LeaveHold>([["2026-09-19", "approved"]]);

    expect(classifyDay("2026-09-19", calendar(), holds).kind).toBe("non-working");
  });

  it("agrees with what the cost summary charged for", () => {
    const cal = calendar([EID]);
    const cost = leaveCost("2026-09-14", "2026-09-20", cal, []);
    const free = new Set(cost.freeDays.map((day) => day.date));

    for (const date of ["2026-09-17", "2026-09-19", "2026-09-20"]) {
      expect(free.has(date)).toBe(true);
      expect(["holiday", "non-working"]).toContain(classifyDay(date, cal).kind);
    }

    for (const date of ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-18"]) {
      expect(free.has(date)).toBe(false);
      expect(classifyDay(date, cal).kind).toBe("working");
    }

    expect(cost.chargedDays).toBe(4);
  });
});

describe("monthsSpanned", () => {
  it("gives one month for a range inside one", () => {
    expect(monthsSpanned("2026-09-14", "2026-09-18")).toEqual(["2026-09"]);
  });

  it("gives both months for a range across a boundary", () => {
    expect(monthsSpanned("2026-09-14", "2026-10-06")).toEqual(["2026-09", "2026-10"]);
  });

  it("gives three for the widest range the form allows", () => {
    // 60 days from the end of September reaches the end of November.
    expect(monthsSpanned("2026-09-30", "2026-11-29")).toEqual(["2026-09", "2026-10", "2026-11"]);
  });

  it("crosses a year end", () => {
    expect(monthsSpanned("2026-12-20", "2027-01-05")).toEqual(["2026-12", "2027-01"]);
  });

  it("gives nothing for an empty or backwards range", () => {
    expect(monthsSpanned("", "")).toEqual([]);
    expect(monthsSpanned("2026-10-06", "2026-09-14")).toEqual([]);
  });

  it("lists the same months the balances are shown for", () => {
    // The calendar draws a grid per month from this, and the summary lists a
    // balance row per month from leaveCost — they must not disagree.
    const cost = leaveCost("2026-09-14", "2026-10-06", calendar(), [AUGUST, SEPTEMBER]);

    expect(monthsSpanned("2026-09-14", "2026-10-06")).toEqual(cost.months.map((entry) => entry.month));
  });
});

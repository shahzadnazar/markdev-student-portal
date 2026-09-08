import type { AcademyCalendar, LeaveBalance } from "@/types";

/**
 * What a picked leave range costs — the arithmetic, with no React around it.
 *
 * Kept separate from the form so it can be tested directly: this is the code
 * that decides whether Submit is disabled and which months a student is told
 * about, and a wrong answer here sends them a rejection they cannot explain.
 *
 * Every input is the server's — the working week and holidays from the academy
 * calendar, the per-month allowance from the leave balances. Nothing here
 * invents a limit; it only reports where the picked range does not fit.
 */

/** One calendar month a picked range touches, and whether it fits there. */
export interface MonthNeed {
  /** "YYYY-MM". */
  month: string;
  label: string;
  /** Chargeable days of the range that fall in this month. */
  needed: number;
  /** The server's balance for it, or null if it served none for this month. */
  balance: LeaveBalance | null;
  short: boolean;
}

/** One picked day that costs nothing, and why. */
export interface FreeDay {
  date: string;
  /** The holiday's name, or null when it is simply a non-working weekday. */
  name: string | null;
}

/**
 * What one date is, as far as the leave allowance is concerned.
 *
 * `holiday` and `non-working` both cost nothing; they are kept apart because
 * calling Eid a weekend is wrong, and because a student reading a calendar
 * needs to know which is which. `on-leave` is a working day already spoken
 * for by another application — the server refuses an overlapping request, so
 * it is shown as unavailable rather than as something to pick.
 */
export type DayKind = "working" | "non-working" | "holiday" | "on-leave";

/** Everything the calendar and the summary both need to know about a date. */
export interface DayFacts {
  kind: DayKind;
  /** The holiday's name when kind is "holiday". */
  holidayName: string | null;
  /** An existing application's hold on this date, if there is one. */
  leaveStatus: LeaveHold | null;
}

/** A day the student has already applied for. Declined days are free again. */
export type LeaveHold = "pending" | "approved";

/**
 * Classify a date once, for everyone who needs to know.
 *
 * The calendar draws from this and the cost is counted from it, so a day the
 * summary calls free cannot be drawn as chargeable — they are the same answer
 * read twice.
 *
 * Order matters. A holiday the academy is closed for is a holiday whatever
 * else is true of it; a non-working weekday likewise. Only a day that would
 * otherwise have counted can be held by another application.
 */
export function classifyDay(
  date: string,
  calendar: AcademyCalendar | null,
  holds: Map<string, LeaveHold> = new Map(),
): DayFacts {
  const holidayName = (calendar?.holidays ?? []).find((day) => day.date === date)?.name ?? null;

  if (holidayName !== null) {
    return { kind: "holiday", holidayName, leaveStatus: holds.get(date) ?? null };
  }

  // Until the calendar loads every day is treated as working: over-counting
  // warns about a range the server would accept, which the student can
  // recover from, where under-counting sends one it refuses.
  if (calendar && !calendar.working_days.includes(isoWeekday(date))) {
    return { kind: "non-working", holidayName: null, leaveStatus: holds.get(date) ?? null };
  }

  const hold = holds.get(date) ?? null;

  return { kind: hold ? "on-leave" : "working", holidayName: null, leaveStatus: hold };
}

export interface LeaveCost {
  /** Days that come out of the allowance. */
  chargedDays: number;
  freeDays: FreeDay[];
  freeWeekends: number;
  freeHolidays: number;
  /** Every month the range touches, in date order. */
  months: MonthNeed[];
  /** The months that block the request. Empty means it fits everywhere. */
  shortMonths: MonthNeed[];
  overLimit: boolean;
}

/** ISO-8601 weekday, 1 = Monday, from a "YYYY-MM-DD" string. */
export function isoWeekday(date: string): number {
  return ((new Date(`${date}T00:00:00`).getDay() + 6) % 7) + 1;
}

/**
 * Every date in a range, inclusive, as "YYYY-MM-DD".
 *
 * Stepped as local dates rather than by adding milliseconds, so a daylight
 * change cannot drop or repeat a day.
 */
export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const last = new Date(`${to}T00:00:00`);

  for (let day = new Date(`${from}T00:00:00`); day <= last; day.setDate(day.getDate() + 1)) {
    dates.push(
      `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
    );
  }

  return dates;
}

/**
 * The first day of every calendar month a range touches, in order.
 *
 * One month for a range inside one, two for a range across a boundary, and
 * three for the widest the form allows — 60 days from today can straddle
 * three, so this counts them rather than assuming two.
 */
export function monthsSpanned(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];

  const months: string[] = [];
  const last = to.slice(0, 7);

  for (let month = from.slice(0, 7); month <= last; ) {
    months.push(month);

    const [year, index] = month.split("-").map(Number);
    const next = new Date(year!, index!, 1);
    month = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  }

  return months;
}

/** "2026-09" → "September 2026", for a month the server sent no balance for. */
function monthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00`);

  return `${date.toLocaleString("en", { month: "long" })} ${date.getFullYear()}`;
}

/**
 * What a range costs this student.
 *
 * Until the calendar loads nothing is excluded: over-counting warns about a
 * range the server would accept, which the student can recover from, where
 * under-counting sends one it refuses.
 */
export function leaveCost(
  from: string,
  to: string,
  calendar: AcademyCalendar | null,
  balances: LeaveBalance[],
): LeaveCost {
  const empty: LeaveCost = {
    chargedDays: 0,
    freeDays: [],
    freeWeekends: 0,
    freeHolidays: 0,
    months: [],
    shortMonths: [],
    overLimit: false,
  };

  if (!from || !to || from > to) return empty;

  // The same rule the server applies when it writes the day rows, so the
  // counter here and the balance it is checked against cannot disagree.
  const dates = datesBetween(from, to);
  const facts = new Map(dates.map((date) => [date, classifyDay(date, calendar)]));
  const isFree = (date: string) => {
    const kind = facts.get(date)!.kind;

    return kind === "holiday" || kind === "non-working";
  };

  const charged = dates.filter((date) => !isFree(date));
  const freeDays: FreeDay[] = dates
    .filter(isFree)
    .map((date) => ({ date, name: facts.get(date)!.holidayName }));

  const perMonth = new Map<string, number>();
  for (const date of charged) {
    const key = date.slice(0, 7);
    perMonth.set(key, (perMonth.get(key) ?? 0) + 1);
  }

  // Every month the range touches, not just the first one that is short:
  // naming one month sends a student to shorten the range, resubmit, and be
  // refused again by the month nobody mentioned.
  const months: MonthNeed[] = [...perMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, needed]) => {
      const balance = balances.find((entry) => entry.month === month) ?? null;

      return {
        month,
        label: balance?.month_label ?? monthLabel(month),
        needed,
        balance,
        // A month the server sent no balance for gets no verdict: inventing a
        // limit for it would be the portal deciding a rule of its own.
        short: balance !== null && needed > balance.remaining,
      };
    });

  const shortMonths = months.filter((entry) => entry.short);
  const freeHolidays = freeDays.filter((day) => day.name !== null).length;

  return {
    chargedDays: charged.length,
    freeDays,
    freeWeekends: freeDays.length - freeHolidays,
    freeHolidays,
    months,
    shortMonths,
    overLimit: shortMonths.length > 0,
  };
}

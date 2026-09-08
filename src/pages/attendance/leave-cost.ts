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

  const holidayNames = new Map((calendar?.holidays ?? []).map((day) => [day.date, day.name]));

  // The same rule the server applies when it writes the day rows, so the
  // counter here and the balance it is checked against cannot disagree.
  const countsAsLeave = (date: string): boolean => {
    if (!calendar) return true;
    if (holidayNames.has(date)) return false;

    return calendar.working_days.includes(isoWeekday(date));
  };

  const dates = datesBetween(from, to);
  const charged = dates.filter(countsAsLeave);
  const freeDays: FreeDay[] = dates
    .filter((date) => !countsAsLeave(date))
    .map((date) => ({ date, name: holidayNames.get(date) ?? null }));

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

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { classifyDay, monthsSpanned } from "./leave-cost";
import type { DayFacts, LeaveHold } from "./leave-cost";
import { formatDate, weekdayHeadings } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AcademyCalendar } from "@/types";

/**
 * The picked range drawn as a calendar, so a student can see what they chose.
 *
 * It reads the same classifier the cost summary counts from, so a day shown as
 * free here is a day the summary did not charge for — they cannot disagree.
 * Nothing about the academy's week or its holidays is assumed: both come from
 * the API, so an academy that opens on Saturdays, or closes for Eid, is drawn
 * correctly without a redeploy.
 *
 * Weeks start on Monday, matching the ISO weekday numbers the API sends.
 */

/** Monday-first, derived rather than written down — see format.ts. */
const WEEK_HEADER = weekdayHeadings();

/** How each kind of day is drawn, and what the legend calls it. */
const DAY_STYLES: Record<
  Exclude<DayFacts["kind"], "working"> | "counted" | "outside",
  { cell: string; legend: string; label: string }
> = {
  counted: {
    cell: "bg-primary text-on-primary font-semibold",
    legend: "bg-primary",
    label: "Counts as leave",
  },
  "non-working": {
    cell: "bg-surface-container text-outline",
    legend: "bg-surface-container ring-1 ring-inset ring-outline-variant",
    label: "Weekend — free",
  },
  holiday: {
    cell: "bg-secondary/20 text-secondary font-medium",
    legend: "bg-secondary/20 ring-1 ring-inset ring-secondary/40",
    label: "Holiday — free",
  },
  "on-leave": {
    cell: "bg-warning-container text-on-warning-container line-through",
    legend: "bg-warning-container",
    label: "Already on leave",
  },
  outside: { cell: "text-outline", legend: "", label: "" },
};

interface LeaveRangeCalendarProps {
  /** "YYYY-MM-DD", inclusive. */
  from: string;
  to: string;
  calendar: AcademyCalendar | null;
  /** Dates already held by another application, by date. */
  holds: Map<string, LeaveHold>;
}

export function LeaveRangeCalendar({ from, to, calendar, holds }: LeaveRangeCalendarProps) {
  if (!from || !to || from > to) return null;

  // Every month the range touches, not just the first two: from today the form
  // reaches 60 days ahead, which can straddle three. Counted by the same
  // helper the summary lists balances from, so the grids and the rows beside
  // them are always the same months.
  const months = monthsSpanned(from, to).map((month) => parseISO(`${month}-01`));

  return (
    <div className="min-w-0">
      {/* Above the months, not below them: a two-month range already fills the
          dialog, and a legend under the second grid is a legend nobody scrolls
          to. */}
      <ul className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        {(["counted", "non-working", "holiday", "on-leave"] as const).map((kind) => (
          <li key={kind} className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <span className={cn("size-2.5 shrink-0 rounded-sm", DAY_STYLES[kind].legend)} />
            {DAY_STYLES[kind].label}
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        {months.map((month) => (
          <MonthGrid
            key={format(month, "yyyy-MM")}
            month={month}
            from={from}
            to={to}
            calendar={calendar}
            holds={holds}
          />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  from,
  to,
  calendar,
  holds,
}: {
  month: Date;
  from: string;
  to: string;
  calendar: AcademyCalendar | null;
  holds: Map<string, LeaveHold>;
}) {
  // Padded to whole weeks so the columns line up under their headings; the
  // padding days are drawn faint and carry no meaning.
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  return (
    <div>
      <p className="mb-1.5 font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
        {format(month, "MMMM yyyy")}
      </p>

      <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label={format(month, "MMMM yyyy")}>
        {WEEK_HEADER.map((day) => (
          <abbr
            key={day.key}
            title={day.full}
            role="columnheader"
            className="pb-1 text-center font-mono text-[10px] uppercase text-outline no-underline"
          >
            {day.short}
          </abbr>
        ))}

        {days.map((day) => {
          const date = format(day, "yyyy-MM-dd");
          const outside = !isSameMonth(day, month);
          const inRange = date >= from && date <= to;
          const facts = classifyDay(date, calendar, holds);

          // The fill says what kind of day it is; the ring says it is inside
          // the range you picked. A holiday inside your range still reads as a
          // holiday, and still shows it was selected.
          const style =
            facts.kind === "working"
              ? inRange
                ? DAY_STYLES.counted
                : DAY_STYLES.outside
              : DAY_STYLES[facts.kind];

          const title = [
            formatDate(date),
            facts.holidayName,
            facts.leaveStatus ? `Already on ${facts.leaveStatus} leave` : null,
          ]
            .filter(Boolean)
            .join(" — ");

          return (
            <div
              key={date}
              role="gridcell"
              title={title}
              aria-label={title}
              aria-selected={inRange}
              data-date={date}
              data-kind={inRange || facts.kind !== "working" ? facts.kind : undefined}
              data-in-range={inRange ? "true" : undefined}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-label-sm tabular-nums",
                outside ? "opacity-30" : style.cell,
                !outside && inRange && facts.kind !== "working" && "ring-2 ring-inset ring-primary",
              )}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

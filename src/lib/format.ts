import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/**
 * The one date pattern this app shows: day first, month named.
 *
 * "9 Aug 2026", never 08/09/2026 and never 09/08/2026. A numeric date is
 * ambiguous in both directions — a reader expecting mm/dd and a reader
 * expecting dd/mm see two different days and neither can tell which was meant.
 * A student picked a 34-day leave range because of exactly that. Naming the
 * month removes the ambiguity outright rather than betting on the reader's
 * expectation.
 *
 * Day-first is also the order these readers use, and it matches the 12-hour
 * AM/PM decision already made for times: show people what they read locally.
 */
const DATE_PATTERN = "d MMM yyyy";

/** "9 Aug 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return format(toDate(value), DATE_PATTERN);
}

/** "9 Aug 2026 · 4:30 PM" — 12-hour, as everywhere else. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return format(toDate(value), `${DATE_PATTERN} · h:mm a`);
}

/** "Today", "Yesterday" or "9 Aug 2026" */
export function formatDayLabel(value: string | Date): string {
  const date = toDate(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, DATE_PATTERN);
}

/**
 * "9 Aug 2026" for one day, "9 Aug – 11 Sep 2026" for a range.
 *
 * The year is written once when both ends share it, which is what makes a
 * range readable; a range crossing new year keeps both.
 */
export function formatDateRange(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined,
): string {
  if (!from || !to) return "—";

  const start = toDate(from);
  const end = toDate(to);

  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return format(start, DATE_PATTERN);
  }

  return format(start, "yyyy") === format(end, "yyyy")
    ? `${format(start, "d MMM")} – ${format(end, DATE_PATTERN)}`
    : `${format(start, DATE_PATTERN)} – ${format(end, DATE_PATTERN)}`;
}

/**
 * Monday-first weekday names, taken from a real week.
 *
 * Derived rather than written down, so there is no list of day names in the
 * app to drift, be localised wrongly, or be mistaken for a statement about
 * which days the academy is open — that is the academy_working_days setting,
 * and it comes from the API.
 */
export function weekdayHeadings(): Array<{ key: string; short: string; full: string }> {
  const monday = new Date(2024, 0, 1); // A Monday.

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);

    return { key: format(day, "EEE"), short: format(day, "EEEEE"), full: format(day, "EEEE") };
  });
}

/** "Mon" — for compact day strips and table cells. */
export function formatWeekdayShort(value: string | Date): string {
  return format(toDate(value), "EEE");
}

/** "Aug" — a month on its own is never ambiguous, but it lives here too. */
export function formatMonthShort(value: string | Date): string {
  return format(toDate(value), "MMM");
}

/** "August 2026" */
export function formatMonthLong(value: string | Date): string {
  return format(toDate(value), "MMMM yyyy");
}

/** "3 hours ago" */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return formatDistanceToNow(toDate(value), { addSuffix: true });
}

/** 95 → "1h 35m", 45 → "45m" */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * A whole-quiz clock worded for a human: 90 → "90s", 300 → "5m", 330 → "5m 30s".
 *
 * Not formatDuration: that takes MINUTES and would round a 90-second quiz to
 * "2m", which is a minute the student does not have. Quiz limits are seconds
 * now, so short ones have to stay in seconds. Mirrors QuizRules::humanTotal on
 * the server so the two surfaces word the same limit the same way.
 */
export function formatDurationSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 120) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest === 0 ? `${m}m` : `${m}m ${rest}s`;
}

/** 125 → "02:05" (mm:ss), 3725 → "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 2048 → "2 KB" */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** "Shahzad Nazar" → "SN" */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** (1200, "USD") → "$1,200.00" */
export function formatMoney(amount: number | null | undefined, currency = "USD"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** 12345 → "12.3k" */
export function formatCompact(value: number | null | undefined): string {
  if (value == null) return "—";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** 0–100 → "62%" (clamped, rounded) */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(Math.min(100, Math.max(0, value)))}%`;
}

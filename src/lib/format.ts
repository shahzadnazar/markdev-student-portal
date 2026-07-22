import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** "Jan 12, 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return format(toDate(value), "MMM d, yyyy");
}

/** "Jan 12, 2026 · 4:30 PM" */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return format(toDate(value), "MMM d, yyyy · h:mm a");
}

/** "Today", "Yesterday" or "Jan 12, 2026" */
export function formatDayLabel(value: string | Date): string {
  const date = toDate(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
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

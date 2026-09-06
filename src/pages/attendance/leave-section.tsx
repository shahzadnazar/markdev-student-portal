import { useState } from "react";
import { CalendarPlus, Plane } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { FormField } from "@/components/shared/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAcademyCalendar, useApplyForLeave, useLeaveApplications } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AcademyCalendar, LeaveBalance, LeaveStatus } from "@/types";

const statusBadge: Record<LeaveStatus, { variant: "warning" | "success" | "error"; label: string }> = {
  pending: { variant: "warning", label: "Pending review" },
  approved: { variant: "success", label: "Approved" },
  partially_approved: { variant: "warning", label: "Partly approved" },
  rejected: { variant: "error", label: "Declined" },
};

/**
 * Leave applications: apply for a date range and track review status.
 * Approved days are marked as leave in the daily register and count as
 * present in the attendance rate.
 */
/** ISO-8601 weekday, 1 = Monday, from a "YYYY-MM-DD" string. */
function isoWeekday(date: string): number {
  return ((new Date(`${date}T00:00:00`).getDay() + 6) % 7) + 1;
}

/**
 * Every date in a range, inclusive, as "YYYY-MM-DD".
 *
 * Stepped as local dates rather than by adding milliseconds, so a daylight
 * change cannot drop or repeat a day.
 */
function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const last = new Date(`${to}T00:00:00`);

  for (let day = new Date(`${from}T00:00:00`); day <= last; day.setDate(day.getDate() + 1)) {
    dates.push(
      `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
    );
  }

  return dates;
}

export function LeaveSection() {
  const leavesQuery = useLeaveApplications();
  const calendarQuery = useAcademyCalendar();
  const applyLeave = useApplyForLeave();

  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const leaves = leavesQuery.data?.data ?? [];

  // Every number here is the server's. The allowance is an admin setting, so a
  // default held in the portal would be wrong from the moment it changed.
  const balance = leavesQuery.data?.balance ?? null;
  const balances = leavesQuery.data?.balances ?? [];
  const outOfLeave = balance !== null && balance.remaining === 0;

  // The academy's own week and its dated holidays. Both are the server's:
  // the working week is an admin setting and holidays are rows, so an academy
  // that opens on Saturdays — or closes for Eid — must reach this form without
  // a redeploy.
  const calendar: AcademyCalendar | null = calendarQuery.data ?? null;
  const holidayNames = new Map((calendar?.holidays ?? []).map((day) => [day.date, day.name]));

  /**
   * Whether a date costs the student a day of their allowance.
   *
   * The same rule the server applies when it writes the day rows, so the
   * counter here and the balance it is checked against cannot disagree. Until
   * the calendar loads nothing is excluded: over-counting warns about a range
   * the server would accept, which is recoverable, where under-counting would
   * send one it refuses.
   */
  const countsAsLeave = (date: string): boolean => {
    if (!calendar) return true;
    if (holidayNames.has(date)) return false;

    return calendar.working_days.includes(isoWeekday(date));
  };

  /** The picked days that cost nothing, and why. */
  const daysOff = fromDate && toDate && fromDate <= toDate
    ? datesBetween(fromDate, toDate)
        .filter((date) => !countsAsLeave(date))
        .map((date) => ({ date, name: holidayNames.get(date) ?? null }))
    : [];

  const chargedDays = fromDate && toDate && fromDate <= toDate
    ? datesBetween(fromDate, toDate).filter(countsAsLeave).length
    : 0;

  /** How many chargeable days of the picked range fall in each calendar month. */
  const daysPerMonth = (from: string, to: string): Map<string, number> => {
    const counts = new Map<string, number>();

    for (const date of datesBetween(from, to)) {
      if (!countsAsLeave(date)) continue;

      const key = date.slice(0, 7);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
  };

  /**
   * The first month the picked range would overspend.
   *
   * A range straddling a boundary is checked against each month it touches, so
   * the warning can name the one that is short rather than a total that fits
   * nowhere in particular.
   */
  const shortfall: LeaveBalance | null = (() => {
    if (!fromDate || !toDate || fromDate > toDate || balances.length === 0) return null;

    for (const [month, needed] of daysPerMonth(fromDate, toDate)) {
      const monthBalance = balances.find((entry) => entry.month === month);
      if (monthBalance && needed > monthBalance.remaining) return monthBalance;
    }

    return null;
  })();

  const resetForm = () => {
    setFromDate("");
    setToDate("");
    setReason("");
    setError(null);
  };

  const handleSubmit = () => {
    if (!fromDate || !toDate || !reason.trim()) {
      setError("Pick the dates and tell us briefly why you'll be away.");
      return;
    }
    // The server refuses this too; stopping here means the instructor never
    // sees a request that could not be approved in full.
    if (shortfall) {
      return;
    }
    setError(null);
    applyLeave.mutate(
      { from_date: fromDate, to_date: toDate, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Leave application sent — you'll be notified once it's reviewed.");
          setOpen(false);
          resetForm();
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof ApiError
              ? mutationError.message
              : "We couldn't send your application. Please try again.",
          );
        },
      },
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-label-sm text-primary uppercase">Leave</p>
          <CardTitle className="mt-1.5">Leave applications</CardTitle>
          <CardDescription>
            Approved leave days are marked in the register and count as present.
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button size="sm" onClick={() => setOpen(true)} disabled={outOfLeave}>
            <CalendarPlus aria-hidden="true" />
            Apply for leave
          </Button>
          {balance ? (
            <p
              className={cn(
                "font-mono text-label-sm",
                outOfLeave ? "text-error" : "text-on-surface-variant",
              )}
            >
              {balance.used}/{balance.allowance}
              {outOfLeave
                ? ` · Monthly leave limit reached. Resets ${formatDate(balance.resets_on)}.`
                : ` used in ${balance.month_label}`}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {leavesQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : leaves.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
            <Plane className="size-4 shrink-0" aria-hidden="true" />
            No leave applications yet. If you'll be away, apply before the day so your
            attendance isn't marked absent.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {leaves.map((leave) => {
              const badge = statusBadge[leave.status];
              return (
                <li key={leave.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md font-medium text-on-surface">
                      {formatDate(leave.from_date)}
                      {leave.to_date !== leave.from_date ? ` → ${formatDate(leave.to_date)}` : ""}
                      <span className="ml-2 font-mono text-label-sm text-on-surface-variant">
                        {leave.days_count} {leave.days_count === 1 ? "day" : "days"}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-body-sm text-on-surface-variant" title={leave.reason}>
                      {leave.reason}
                    </p>
                    {leave.status === "partially_approved" ? (
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {leave.days.map((day) => (
                          <span
                            key={day.date}
                            className={cn(
                              "rounded-md px-2 py-0.5 font-mono text-label-sm",
                              day.status === "approved"
                                ? "bg-success-container text-on-success-container"
                                : "bg-error-container text-on-error-container",
                            )}
                          >
                            {formatDate(day.date)} {day.status === "approved" ? "approved" : "declined"}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    {leave.review_note ? (
                      <p className="mt-0.5 text-body-sm text-on-surface-variant">
                        <span className="font-semibold">Note from the academy:</span> {leave.review_note}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for leave</DialogTitle>
            <DialogDescription>
              Tell us when you'll be away and why. Once approved, those days are marked as
              leave and count as present in your attendance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error ? (
              <p className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm text-on-error-container">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="From" htmlFor="leave-from">
                <Input
                  id="leave-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </FormField>
              <FormField label="To" htmlFor="leave-to">
                <Input
                  id="leave-to"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </FormField>
            </div>
            {daysOff.length > 0 ? (
              <p className="rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface-variant">
                <span className="font-medium text-on-surface">
                  {chargedDays} {chargedDays === 1 ? "day counts" : "days count"} against your leave
                </span>{" "}
                — the academy is closed on{" "}
                {daysOff.map((day, index) => (
                  <span key={day.date}>
                    {index > 0 ? (index === daysOff.length - 1 ? " and " : ", ") : ""}
                    {formatDate(day.date)}
                    {day.name ? ` (${day.name})` : ""}
                  </span>
                ))}
                , so {daysOff.length === 1 ? "it costs" : "they cost"} you nothing.
              </p>
            ) : null}
            {shortfall ? (
              <p className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm font-medium text-on-error-container">
                Your remaining leave limit is {shortfall.remaining}
                {balances.length > 1 ? ` in ${shortfall.month_label}` : ""}. Shorten the
                dates to fit before sending this.
              </p>
            ) : null}
            <FormField label="Reason" htmlFor="leave-reason">
              <Textarea
                id="leave-reason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Family wedding out of the city"
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={applyLeave.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={applyLeave.isPending || shortfall !== null}>
              {applyLeave.isPending ? (
                <>
                  <Spinner className="text-on-primary" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  <CalendarPlus aria-hidden="true" />
                  Submit application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

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
import { LeaveRangeCalendar } from "./leave-calendar";
import { leaveCost } from "./leave-cost";
import type { LeaveCost, LeaveHold } from "./leave-cost";
import { formatDate, formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AcademyCalendar, LeaveStatus } from "@/types";

/**
 * What the reviewer's note is called, given what they decided.
 *
 * A note is required the moment any day is turned down, so on a decline —
 * whole or partial — it is the reason and is named as one. On a full approval
 * it is optional and is just a note, so calling it a decline reason there
 * would tell a student they were refused when they were not.
 */
const reviewNoteLabel: Record<LeaveStatus, string> = {
  rejected: "Reason for decline",
  partially_approved: "Reason for the declined days",
  approved: "Note from the academy",
  pending: "Note from the academy",
};

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
/** "YYYY-MM-DD" for a date this many days from today, in local time. */
function isoDay(offsetDays = 0): string {
  const day = new Date();
  day.setDate(day.getDate() + offsetDays);

  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

/**
 * The window the API accepts: from today, up to 60 days ahead.
 *
 * Mirrored onto the pickers so a student cannot choose a date the server would
 * refuse. It also keeps the range inside the months the API serves balances
 * for, so every month shown below has a real limit beside it rather than a
 * shrug.
 */
const EARLIEST_LEAVE_DAY = isoDay(0);
const LATEST_LEAVE_DAY = isoDay(60);

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
  const hasRange = Boolean(fromDate && toDate && fromDate <= toDate);

  /**
   * Dates already spoken for by another application.
   *
   * Pending and approved days both hold — the same two the server counts
   * against the allowance — while a declined day is free again. The server
   * refuses a request overlapping one of these outright, so the calendar marks
   * them unavailable rather than letting a student pick into a rejection.
   *
   * Read from the applications already on screen, which is the most recent
   * page: anything inside the 60-day window this form reaches is on it.
   */
  const leaveHolds = new Map<string, LeaveHold>(
    leaves.flatMap((application) =>
      application.days
        .filter((day) => day.status === "pending" || day.status === "approved")
        .map((day) => [day.date, day.status as LeaveHold] as const),
    ),
  );

  // One implementation of what a range costs, shared with its tests. The form
  // only renders the answer; it decides none of it.
  const cost = leaveCost(fromDate, toDate, calendar, balances);
  const overLimit = cost.overLimit;

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
    if (overLimit) {
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
                        {/* Only reached once every day has been ruled on, but
                            named per state rather than "approved or else",
                            which would label a pending day declined. */}
                        {leave.days.map((day) => (
                          <span
                            key={day.date}
                            className={cn(
                              "rounded-md px-2 py-0.5 font-mono text-label-sm",
                              day.status === "approved" && "bg-success-container text-on-success-container",
                              day.status === "declined" && "bg-error-container text-on-error-container",
                              day.status === "pending" && "bg-warning-container text-on-warning-container",
                            )}
                          >
                            {formatDate(day.date)} {day.status}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    {leave.review_note ? (
                      <p className="mt-0.5 text-body-sm text-on-surface-variant">
                        <span className="font-semibold">{reviewNoteLabel[leave.status]}:</span>{" "}
                        {leave.review_note}
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
        {/* Wider than the default so the summary and the calendar sit side
            by side instead of stacking into a longer scroll. */}
        <DialogContent className="sm:max-w-3xl">
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
                  min={EARLIEST_LEAVE_DAY}
                  max={LATEST_LEAVE_DAY}
                  onChange={(event) => setFromDate(event.target.value)}
                  aria-describedby="leave-from-reading"
                />
                {/* The field's own text is drawn by the browser in its locale —
                    08/09/2026 on an en-US browser — and no page can restyle it.
                    So the unambiguous reading sits right under it, which is
                    what a student checks before submitting. */}
                <p id="leave-from-reading" className="mt-1 text-label-sm text-on-surface-variant">
                  {fromDate ? formatDate(fromDate) : "Pick a start date"}
                </p>
              </FormField>
              <FormField label="To" htmlFor="leave-to">
                <Input
                  id="leave-to"
                  type="date"
                  value={toDate}
                  min={fromDate || EARLIEST_LEAVE_DAY}
                  max={LATEST_LEAVE_DAY}
                  onChange={(event) => setToDate(event.target.value)}
                  aria-describedby="leave-to-reading"
                />
                <p id="leave-to-reading" className="mt-1 text-label-sm text-on-surface-variant">
                  {toDate ? formatDate(toDate) : "Pick an end date"}
                </p>
              </FormField>
            </div>

            <FormField label="Reason" htmlFor="leave-reason">
              <Textarea
                id="leave-reason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Family wedding out of the city"
              />
            </FormField>

            {/* Directly above Submit: the reason the button is disabled sits
                next to the button it disables, rather than being separated
                from it by the reason box. Two columns where there is room —
                which also makes the dialog shorter than the stacked version,
                so a laptop scrolls less, not more — and stacked below sm. */}
            {hasRange ? (
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-start">
                <LeaveCostSummary from={fromDate} to={toDate} cost={cost} />
                <LeaveRangeCalendar
                  from={fromDate}
                  to={toDate}
                  calendar={calendar}
                  holds={leaveHolds}
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={applyLeave.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={applyLeave.isPending || overLimit}>
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


/**
 * What a picked range costs, immediately above the Submit button.
 *
 * Two separate facts, on two separate lines, cost first: the days that count,
 * then the days that do not. They used to share one sentence — "25 days count
 * against your leave — the academy is closed on ... so they cost you nothing" —
 * which reads as though the 25 were the free ones, with nine dates in between
 * burying the only number that decides anything.
 *
 * Every figure is the server's. The month balances come from the API and the
 * free days from the academy calendar it serves; nothing here is a rule of the
 * portal's own.
 */
function LeaveCostSummary({ from, to, cost }: { from: string; to: string; cost: LeaveCost }) {
  const { chargedDays, freeDays, freeWeekends, freeHolidays, months, shortMonths, overLimit } = cost;

  // "9 weekend days", "2 public holidays", or both — a range containing Eid
  // must not have it called a weekend.
  const freeParts = [
    freeWeekends > 0 ? `${freeWeekends} weekend ${freeWeekends === 1 ? "day" : "days"}` : null,
    freeHolidays > 0 ? `${freeHolidays} public ${freeHolidays === 1 ? "holiday" : "holidays"}` : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3",
        overLimit ? "bg-error-container/60" : "bg-surface-container",
      )}
    >
      <p className="text-body-sm font-medium text-on-surface">
        {chargedDays === 0
          ? "This request uses no leave days."
          : `This request uses ${chargedDays} leave ${chargedDays === 1 ? "day" : "days"}.`}{" "}
        <span className="font-normal text-on-surface-variant">{formatDateRange(from, to)}</span>
      </p>

      {freeParts.length > 0 ? (
        <p className="mt-1 text-body-sm text-on-surface-variant">
          {/* Agreement follows the total, not the first part: "1 public holiday
              is free and does not count", "9 weekend days are free and do not". */}
          {/* Which days they are is answered by the calendar beside this,
              where they are marked — a list here would say it twice. */}
          {freeParts.join(" and ")} in this range{" "}
          {freeDays.length === 1 ? "is free and does not count" : "are free and do not count"}.
        </p>
      ) : null}

      {/* Every month the range touches, not just the first one that is short:
          shortening to fit September only to be refused by August is exactly
          what naming one month causes. */}
      {months.length > 0 ? (
        <ul className="mt-2.5 space-y-1">
          {months.map((entry) => (
            <li
              key={entry.month}
              className={cn(
                "flex flex-wrap items-baseline justify-between gap-x-3 text-body-sm",
                entry.short ? "font-medium text-on-error-container" : "text-on-surface-variant",
              )}
            >
              <span>{entry.label}</span>
              <span>
                {entry.needed} {entry.needed === 1 ? "day" : "days"} needed
                {entry.balance ? ` · ${entry.balance.remaining} left` : ""}
                {entry.short ? " — over the limit" : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {overLimit ? (
        <p className="mt-2.5 text-body-sm font-medium text-on-error-container">
          {shortMonths.length === 1
            ? `${shortMonths[0]!.label} is short.`
            : `${shortMonths.map((entry) => entry.label).join(" and ")} are both short.`}{" "}
          Shorten the dates to fit before sending this.
        </p>
      ) : null}
    </div>
  );
}

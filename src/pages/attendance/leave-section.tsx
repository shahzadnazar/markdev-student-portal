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
import { useApplyForLeave, useLeaveApplications } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import type { LeaveStatus } from "@/types";

const statusBadge: Record<LeaveStatus, { variant: "warning" | "success" | "error"; label: string }> = {
  pending: { variant: "warning", label: "Pending review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "error", label: "Rejected" },
};

/**
 * Leave applications: apply for a date range and track review status.
 * Approved days are marked as leave in the daily register and count as
 * present in the attendance rate.
 */
export function LeaveSection() {
  const leavesQuery = useLeaveApplications();
  const applyLeave = useApplyForLeave();

  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const leaves = leavesQuery.data?.data ?? [];

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
        <Button size="sm" onClick={() => setOpen(true)}>
          <CalendarPlus aria-hidden="true" />
          Apply for leave
        </Button>
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
            <Button onClick={handleSubmit} disabled={applyLeave.isPending}>
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

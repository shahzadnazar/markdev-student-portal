import { useState } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  TrendingUp,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationBar } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendance, useAttendanceSummary } from "@/hooks/use-engagement";
import { formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { AttendanceRecord, AttendanceStatus } from "@/types";

const PER_PAGE = 10;

type StatusFilter = AttendanceStatus | "all";

const statusOptions: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

const statusBadge: Record<
  AttendanceStatus,
  { variant: "success" | "warning" | "error" | "neutral"; label: string }
> = {
  present: { variant: "success", label: "Present" },
  late: { variant: "warning", label: "Late" },
  absent: { variant: "error", label: "Absent" },
  excused: { variant: "neutral", label: "Excused" },
};

/** Shared column template for the desktop table header and rows. */
const rowGrid = "md:grid-cols-[9.5rem_minmax(0,1.6fr)_7.5rem_minmax(0,1fr)]";

export default function AttendancePage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const summaryQuery = useAttendanceSummary({
    from: from || undefined,
    to: to || undefined,
  });

  const attendanceQuery = useAttendance({
    page,
    per_page: PER_PAGE,
    status: status === "all" ? undefined : status,
    from: from || undefined,
    to: to || undefined,
  });

  const hasFilters = status !== "all" || from !== "" || to !== "";

  const handleStatusChange = (value: string) => {
    setStatus(value as StatusFilter);
    setPage(1);
  };

  const clearFilters = () => {
    setStatus("all");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const records = attendanceQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title="Attendance"
        description="Your presence across live sessions — track your attendance rate and review every session you've joined or missed."
      />

      {/* Summary stats */}
      <section aria-label="Attendance summary" className="mb-8">
        {summaryQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : summaryQuery.isError ? (
          <ErrorState
            title="Couldn't load your attendance summary"
            error={summaryQuery.error}
            onRetry={() => {
              void summaryQuery.refetch();
            }}
            className="py-10"
          />
        ) : summaryQuery.data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Attendance rate"
              value={formatPercent(summaryQuery.data.attendance_rate)}
              icon={TrendingUp}
              tone="primary"
              hint={`${summaryQuery.data.total_sessions} ${
                summaryQuery.data.total_sessions === 1 ? "session" : "sessions"
              } tracked`}
            />
            <StatCard
              label="Present"
              value={summaryQuery.data.present_count}
              icon={CheckCircle2}
              tone="success"
              hint={`of ${summaryQuery.data.total_sessions} sessions`}
            />
            <StatCard
              label="Late"
              value={summaryQuery.data.late_count}
              icon={Clock}
              tone="warning"
              hint="Joined after the session started"
            />
            <StatCard
              label="Absent"
              value={summaryQuery.data.absent_count}
              icon={AlertCircle}
              tone="warning"
              hint={`${summaryQuery.data.excused_count} excused`}
            />
          </div>
        ) : null}
      </section>

      {/* Filters */}
      <motion.section
        aria-label="Filter attendance records"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="mb-6"
      >
        <Card className="gap-0 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full space-y-1.5 md:w-48">
              <Label htmlFor="attendance-status">Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger id="attendance-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full space-y-1.5 md:w-44">
              <Label htmlFor="attendance-from">From</Label>
              <Input
                id="attendance-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-full space-y-1.5 md:w-44">
              <Label htmlFor="attendance-to">To</Label>
              <Input
                id="attendance-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            {hasFilters ? (
              <Button variant="ghost" size="sm" className="md:mb-1" onClick={clearFilters}>
                <X aria-hidden="true" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </Card>
      </motion.section>

      {/* Records */}
      <motion.section
        aria-label="Attendance records"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        {attendanceQuery.isLoading ? (
          <Card className="gap-0 overflow-hidden py-0">
            {Array.from({ length: 6 }, (_, index) => (
              <AttendanceRowSkeleton key={index} withBorder={index > 0} />
            ))}
          </Card>
        ) : attendanceQuery.isError ? (
          <ErrorState
            title="Couldn't load your attendance records"
            error={attendanceQuery.error}
            onRetry={() => {
              void attendanceQuery.refetch();
            }}
          />
        ) : !attendanceQuery.data || attendanceQuery.data.data.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={hasFilters ? "No records match your filters" : "No attendance records yet"}
            description={
              hasFilters
                ? "Try widening the date range or switching the status filter to see more sessions."
                : "Once your courses hold live sessions, your attendance will be recorded and shown here."
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  <X aria-hidden="true" />
                  Clear filters
                </Button>
              ) : (
                <Button variant="secondary" asChild>
                  <Link to={paths.courses}>
                    <Compass aria-hidden="true" />
                    Browse courses
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            <p className="mb-4 font-mono text-label-sm text-on-surface-variant uppercase">
              {attendanceQuery.data.meta.total}{" "}
              {attendanceQuery.data.meta.total === 1 ? "record" : "records"}
            </p>

            <Card
              className={cn(
                "gap-0 overflow-hidden py-0 transition-opacity duration-200",
                attendanceQuery.isPlaceholderData && attendanceQuery.isFetching && "opacity-60",
              )}
            >
              {/* Desktop table header */}
              <div
                aria-hidden="true"
                className={cn(
                  "hidden border-b border-outline-variant/40 px-6 py-3 font-mono text-label-sm text-on-surface-variant uppercase md:grid md:items-center md:gap-4",
                  rowGrid,
                )}
              >
                <span>Date</span>
                <span>Session</span>
                <span>Status</span>
                <span>Notes</span>
              </div>

              <ul className="divide-y divide-outline-variant/30">
                {records.map((record, index) => (
                  <motion.li
                    key={record.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(index * 0.04, 0.3),
                      ease: "easeOut",
                    }}
                  >
                    <AttendanceRow record={record} />
                  </motion.li>
                ))}
              </ul>
            </Card>

            <PaginationBar
              meta={attendanceQuery.data.meta}
              onPageChange={handlePageChange}
              className="mt-6"
            />
          </>
        )}
      </motion.section>
    </div>
  );
}

function AttendanceRow({ record }: { record: AttendanceRecord }) {
  const badge = statusBadge[record.status];
  const sessionLabel = record.session_title ?? record.course?.title ?? "Session";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-6 py-4 transition-colors duration-150 hover:bg-surface-ice/60 md:grid md:items-center md:gap-4",
        rowGrid,
      )}
    >
      {/* Date + (mobile) status */}
      <div className="flex items-start justify-between gap-3 md:block">
        <div>
          <p className="text-body-sm font-medium text-on-surface">{formatDate(record.date)}</p>
          <p className="mt-0.5 font-mono text-label-sm text-on-surface-variant uppercase">
            {format(parseISO(record.date), "EEE")}
          </p>
        </div>
        <span className="md:hidden">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </span>
      </div>

      {/* Session title + course chip */}
      <div className="min-w-0">
        <p className="truncate text-body-md font-medium text-on-surface" title={sessionLabel}>
          {sessionLabel}
        </p>
        {record.course ? (
          <Badge variant="primary" className="mt-1.5 max-w-full">
            <span className="min-w-0 truncate">{record.course.title}</span>
          </Badge>
        ) : null}
      </div>

      {/* Desktop status */}
      <span className="hidden md:block">
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </span>

      {/* Notes */}
      {record.notes ? (
        <p className="truncate text-body-sm text-on-surface-variant" title={record.notes}>
          {record.notes}
        </p>
      ) : (
        <p aria-hidden="true" className="hidden text-body-sm text-outline md:block">
          —
        </p>
      )}
    </div>
  );
}

/** Loading row mirroring the record layout. */
function AttendanceRowSkeleton({ withBorder }: { withBorder: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-6 py-4 md:grid md:items-center md:gap-4",
        rowGrid,
        withBorder && "border-t border-outline-variant/30",
      )}
    >
      <div className="flex items-start justify-between gap-3 md:block">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3.5 w-10" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full md:hidden" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-32 rounded-full" />
      </div>
      <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
      <Skeleton className="hidden h-4 w-2/3 md:block" />
    </div>
  );
}

/** Loading tile mirroring the StatCard layout. */
function StatCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-card">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3.5 w-28" />
      </div>
    </div>
  );
}

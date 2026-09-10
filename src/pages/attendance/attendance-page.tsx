import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CalendarDays, CalendarOff, CheckCircle2, Clock, TrendingUp, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { LeaveSection } from "./leave-section";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceSummary, useDailyAttendance } from "@/hooks/use-engagement";
import { formatDate, formatMoney, formatPercent, formatWeekdayShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AbsenceBalance, DailyAttendanceRecord, DailyAttendanceStatus } from "@/types";

const PER_PAGE = 10;

// No "all" row any more: ticking nothing IS all, and an explicit option for
// it would be a second way to say the same thing that the Select all row in
// the dropdown already says better.
const statusOptions: ReadonlyArray<{ value: DailyAttendanceStatus; label: string }> = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
  { value: "excused", label: "Excused" },
  { value: "holiday", label: "Holiday" },
];

export const statusBadge: Record<
  DailyAttendanceStatus,
  { variant: "success" | "warning" | "error" | "neutral" | "secondary"; label: string }
> = {
  present: { variant: "success", label: "Present" },
  late: { variant: "warning", label: "Late" },
  absent: { variant: "error", label: "Absent" },
  leave: { variant: "neutral", label: "Leave" },
  // Its own label rather than a second kind of Leave: it is worth the same
  // half day, but it did not come out of the student's leave allowance and
  // saying "Leave" would tell them it did.
  excused: { variant: "neutral", label: "Excused" },
  // Deliberately its own colour rather than a shade of any of the four above:
  // a day the academy was shut is not a verdict on the student, and it is not
  // counted in the cards or the rate either.
  holiday: { variant: "secondary", label: "Holiday" },
};

/**
 * What a row shows in its middle column.
 *
 * A holiday names itself — the gap where Eid was would otherwise read as
 * missing data. Every other day shows the session it was, and says so plainly
 * when there wasn't one rather than leaving the column blank.
 *
 * Pulled out of the row so it can be tested: the suite runs in node with no
 * DOM, and this is the decision worth pinning — the session title and the
 * course survived the merge of the two attendance tables into one, and they
 * are the two facts the retired table contributed.
 */
export function sessionLabel(record: Pick<DailyAttendanceRecord, "status" | "session_title" | "remarks">): {
  text: string;
  muted: boolean;
  holiday: boolean;
} {
  if (record.status === "holiday") {
    return { text: record.remarks ?? "Academy closed", muted: false, holiday: true };
  }

  if (record.session_title) {
    return { text: record.session_title, muted: false, holiday: false };
  }

  return { text: "No session", muted: true, holiday: false };
}

/**
 * What the Absent card says beneath its number.
 *
 * Mirrors the leave counter: used out of the allowance, and what it is costing
 * once it goes past. Every number is the server's — the allowance and the
 * per-absence amount are admin settings, so a default here would be wrong the
 * moment either changed.
 */
function absenceHint(balance: AbsenceBalance): string {
  const counter = `${balance.used}/${balance.allowance} this month`;

  if (balance.chargeable === 0) {
    return `${counter} · within the allowance`;
  }

  if (balance.fine_total === 0) {
    return `${counter} · ${balance.chargeable} beyond the allowance`;
  }

  return `${counter} · ${balance.chargeable} beyond the allowance`;
}

/** Shared column template for the desktop table header and rows. */
const rowGrid = "md:grid-cols-[11rem_minmax(0,1fr)_8rem]";

/**
 * The student's attendance, which at this academy means the daily register.
 *
 * Everything on this page reads that one table — and there is only one table
 * to read now, since the per-class attendance sheet was folded into the
 * register. The cards used to count those per-class rows, which approved leave
 * never touches, so the Leave card read zero on a page whose every listed day
 * said Leave.
 */
export default function AttendancePage() {
  const [status, setStatus] = useState<DailyAttendanceStatus[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const recordsRef = useRef<HTMLElement>(null);

  /**
   * Bring the list into view when a filter changes.
   *
   * The filters sit above the leave applications and the cards, so on a short
   * screen the rows they narrow are off the bottom and the change looks like
   * nothing happened.
   */
  const revealRecords = () => {
    window.requestAnimationFrame(() => {
      recordsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const filters = {
    // Empty is left off the request entirely rather than sent as [], so the
    // server sees "no filter" and not "match nothing".
    status: status.length > 0 ? status : undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const summaryQuery = useAttendanceSummary({ from: filters.from, to: filters.to });
  const dailyQuery = useDailyAttendance({ ...filters, page, per_page: PER_PAGE });

  const hasFilters = status.length > 0 || from !== "" || to !== "";
  const records = dailyQuery.data?.data ?? [];

  const handleStatusChange = (value: string[]) => {
    setStatus(value as DailyAttendanceStatus[]);
    setPage(1);
    revealRecords();
  };

  const clearFilters = () => {
    setStatus([]);
    setFrom("");
    setTo("");
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    revealRecords();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title="Attendance"
        description="Every day the academy has a record of — sessions you joined or missed, and days covered by approved leave."
      />

      {/* Filters — first, because they narrow everything below them. */}
      <motion.section
        aria-label="Filter attendance records"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mb-6"
      >
        <Card className="gap-0 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full space-y-1.5 md:w-48">
              <Label htmlFor="attendance-status">Status</Label>
              <MultiSelect
                label="Filter attendance by status"
                className="w-full"
                placeholder="All statuses"
                options={statusOptions}
                value={status}
                onChange={handleStatusChange}
              />
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
                  revealRecords();
                }}
                aria-describedby="attendance-from-reading"
              />
              {/* The field draws its own text in the browser's locale, which no
                  page can restyle; this is the unambiguous reading of it. */}
              <p id="attendance-from-reading" className="text-label-sm text-on-surface-variant">
                {from ? formatDate(from) : "Any start date"}
              </p>
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
                  revealRecords();
                }}
                aria-describedby="attendance-to-reading"
              />
              <p id="attendance-to-reading" className="text-label-sm text-on-surface-variant">
                {to ? formatDate(to) : "Any end date"}
              </p>
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

      <LeaveSection />

      {/* Summary stats */}
      <section aria-label="Attendance summary" className="mb-6">
        {summaryQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
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
          <>
            {summaryQuery.data.absence_balance.fine_total > 0 ? (
              <p className="mb-3 rounded-xl bg-error-container/60 px-4 py-3 text-body-sm font-medium text-on-error-container">
                Your fine is{" "}
                {formatMoney(
                  summaryQuery.data.absence_balance.fine_total,
                  summaryQuery.data.absence_balance.currency,
                )}{" "}
                and has been added to your fee — {summaryQuery.data.absence_balance.chargeable}{" "}
                {summaryQuery.data.absence_balance.chargeable === 1 ? "absence" : "absences"} beyond
                the {summaryQuery.data.absence_balance.allowance} allowed in{" "}
                {summaryQuery.data.absence_balance.month_label}.
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Attendance rate"
              value={formatPercent(summaryQuery.data.attendance_rate)}
              icon={TrendingUp}
              tone="primary"
              hintBelow
              hint={`${summaryQuery.data.total_sessions} ${
                summaryQuery.data.total_sessions === 1 ? "day" : "days"
              } tracked`}
            />
            <StatCard
              label="Present"
              value={summaryQuery.data.present_count}
              icon={CheckCircle2}
              tone="success"
              hintBelow
              hint={`of ${summaryQuery.data.total_sessions} days`}
            />
            <StatCard
              label="Late"
              value={summaryQuery.data.late_count}
              icon={Clock}
              tone="warning"
              hintBelow
              hint="After the start time"
            />
            <StatCard
              label="Absent"
              value={summaryQuery.data.absent_count}
              icon={AlertCircle}
              tone="warning"
              hintBelow
              hint={absenceHint(summaryQuery.data.absence_balance)}
            />
            <StatCard
              label="Leave"
              value={summaryQuery.data.leave_count}
              icon={CalendarOff}
              tone="secondary"
              hintBelow
              hint="Approved leave"
            />
            </div>
            {summaryQuery.data.excused_count > 0 ? (
              // A line rather than a sixth card, like the holiday note below:
              // rare, and what the student needs is the reassurance about
              // their allowance rather than the number.
              <p className="mt-3 text-body-sm text-on-surface-variant">
                {summaryQuery.data.excused_count}{" "}
                {summaryQuery.data.excused_count === 1 ? "day was" : "days were"} excused by the
                academy. {summaryQuery.data.excused_count === 1 ? "It counts" : "They count"} the
                same as approved leave toward your rate, but{" "}
                {summaryQuery.data.excused_count === 1 ? "it did" : "they did"} not come out of your
                leave allowance.
              </p>
            ) : null}
            {summaryQuery.data.holiday_count > 0 ? (
              // A line rather than a sixth card: the number itself is not the
              // point, the reassurance is — a day off does not touch the rate
              // and cannot be fined.
              <p className="mt-3 text-body-sm text-on-surface-variant">
                {summaryQuery.data.holiday_count}{" "}
                {summaryQuery.data.holiday_count === 1 ? "day" : "days"} the academy was closed{" "}
                {summaryQuery.data.holiday_count === 1 ? "is" : "are"} listed below but not counted
                — they don't affect your rate and can't be fined.
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      {/* Records */}
      <motion.section
        ref={recordsRef}
        aria-label="Attendance records"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        {dailyQuery.isLoading ? (
          <Card className="gap-0 overflow-hidden py-0">
            {Array.from({ length: 6 }, (_, index) => (
              <AttendanceRowSkeleton key={index} withBorder={index > 0} />
            ))}
          </Card>
        ) : dailyQuery.isError ? (
          <ErrorState
            title="Couldn't load your attendance records"
            error={dailyQuery.error}
            onRetry={() => {
              void dailyQuery.refetch();
            }}
          />
        ) : records.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={hasFilters ? "No days match your filters" : "No attendance marked yet"}
            description={
              hasFilters
                ? "Try widening the date range or switching the status filter to see more days."
                : "Once the academy starts marking the register, every one of your days will be listed here."
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  <X aria-hidden="true" />
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-4 font-mono text-label-sm text-on-surface-variant uppercase">
              {dailyQuery.data?.meta.total}{" "}
              {dailyQuery.data?.meta.total === 1 ? "day" : "days"}
            </p>

            <Card
              className={cn(
                "gap-0 overflow-hidden py-0 transition-opacity duration-200",
                dailyQuery.isPlaceholderData && dailyQuery.isFetching && "opacity-60",
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

            {dailyQuery.data ? (
              <PaginationBar
                meta={dailyQuery.data.meta}
                onPageChange={handlePageChange}
                className="mt-6"
              />
            ) : null}
          </>
        )}
      </motion.section>
    </div>
  );
}

function AttendanceRow({ record }: { record: DailyAttendanceRecord }) {
  const badge = statusBadge[record.status];
  const session = sessionLabel(record);

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
            {formatWeekdayShort(record.date)}
          </p>
        </div>
        <span className="md:hidden">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </span>
      </div>

      {/* Session title + course chip — or, on a day off, which holiday it was */}
      <div className="min-w-0">
        {session.muted ? (
          <p className="text-body-sm text-outline">{session.text}</p>
        ) : (
          <p
            className={cn(
              "truncate text-body-md font-medium",
              session.holiday ? "text-secondary" : "text-on-surface",
            )}
            title={session.text}
          >
            {session.text}
          </p>
        )}
        {record.course ? (
          <Badge variant="primary" className="mt-1.5 max-w-full">
            <span className="min-w-0 truncate">{record.course.title}</span>
          </Badge>
        ) : null}
      </div>

      {/* Desktop status */}
      <div className="hidden md:block">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {record.corrected ? (
          <p className="mt-1 font-mono text-label-sm uppercase text-on-surface-variant/60">corrected</p>
        ) : null}
      </div>
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

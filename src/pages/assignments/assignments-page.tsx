import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssignments } from "@/hooks/use-assessments";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Assignment, AssignmentStatus } from "@/types";

const PER_PAGE = 10;

type StatusFilter = AssignmentStatus | "all";

const statusTabs: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "graded", label: "Graded" },
  { value: "overdue", label: "Overdue" },
];

/** Icon tile treatment per assignment status. */
const statusConfig: Record<AssignmentStatus, { icon: LucideIcon; tile: string; label: string }> = {
  pending: { icon: Clock, tile: "bg-warning-container text-warning", label: "Pending" },
  submitted: { icon: Send, tile: "bg-primary/10 text-primary", label: "Submitted" },
  graded: { icon: CheckCircle2, tile: "bg-success-container text-success", label: "Graded" },
  overdue: { icon: AlertCircle, tile: "bg-error-container text-error", label: "Overdue" },
  returned: { icon: AlertCircle, tile: "bg-warning-container text-warning", label: "Returned" },
};

const emptyCopy: Record<StatusFilter, { icon: LucideIcon; title: string; description: string }> = {
  all: {
    icon: ClipboardList,
    title: "No assignments yet",
    description:
      "When your instructors publish assignments for your enrolled courses, they'll show up here.",
  },
  pending: {
    icon: CheckCircle2,
    title: "Nothing pending",
    description: "You're all caught up — no assignments are waiting on you right now.",
  },
  submitted: {
    icon: Send,
    title: "Nothing in review",
    description: "Work you've handed in appears here while it waits to be graded.",
  },
  graded: {
    icon: Award,
    title: "No graded work yet",
    description: "Once an instructor grades one of your submissions, the result will appear here.",
  },
  overdue: {
    icon: CheckCircle2,
    title: "Nothing overdue",
    description: "Great news — you haven't missed a single deadline.",
  },
  returned: {
    icon: Send,
    title: "Nothing returned",
    description: "Assignments an instructor sends back for changes will appear here.",
  },
};

export default function AssignmentsPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const assignmentsQuery = useAssignments({
    page,
    per_page: PER_PAGE,
    status: status === "all" ? undefined : status,
  });

  const handleStatusChange = (value: string) => {
    setStatus(value as StatusFilter);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const assignments = assignmentsQuery.data?.data ?? [];
  const empty = emptyCopy[status];

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title="Assignments"
        description="Track everything due across your courses — submit your work, watch for grades, and stay ahead of deadlines."
      />

      {/* Status filter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="mb-6 overflow-x-auto"
      >
        <Tabs value={status} onValueChange={handleStatusChange}>
          <TabsList aria-label="Filter assignments by status">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      <motion.section
        aria-label="Assignments"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        {assignmentsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <AssignmentRowSkeleton key={index} />
            ))}
          </div>
        ) : assignmentsQuery.isError ? (
          <ErrorState
            title="Couldn't load your assignments"
            error={assignmentsQuery.error}
            onRetry={() => {
              void assignmentsQuery.refetch();
            }}
          />
        ) : !assignmentsQuery.data || assignmentsQuery.data.data.length === 0 ? (
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            action={
              status === "all" ? (
                <Button variant="secondary" asChild>
                  <Link to={paths.courses}>
                    <Compass aria-hidden="true" />
                    Browse courses
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => handleStatusChange("all")}>
                  View all assignments
                </Button>
              )
            }
          />
        ) : (
          <>
            <p className="mb-4 font-mono text-label-sm text-on-surface-variant uppercase">
              {assignmentsQuery.data.meta.total}{" "}
              {assignmentsQuery.data.meta.total === 1 ? "assignment" : "assignments"}
            </p>

            <ul
              className={cn(
                "space-y-3 transition-opacity duration-200",
                assignmentsQuery.isPlaceholderData && assignmentsQuery.isFetching && "opacity-60",
              )}
            >
              {assignments.map((assignment, index) => (
                <motion.li
                  key={assignment.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.05, 0.35),
                    ease: "easeOut",
                  }}
                >
                  <AssignmentRow assignment={assignment} />
                </motion.li>
              ))}
            </ul>

            <PaginationBar
              meta={assignmentsQuery.data.meta}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          </>
        )}
      </motion.section>
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const { icon: StatusIcon, tile, label } = statusConfig[assignment.status];
  const isOverdue = assignment.status === "overdue";
  const score = assignment.status === "graded" ? assignment.submission?.score : null;
  const feedback = assignment.status === "graded" ? assignment.submission?.feedback : null;

  return (
    <Link
      to={paths.assignment(assignment.id)}
      className="group flex items-center gap-4 rounded-2xl bg-white p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated"
    >
      {/* Status tile */}
      <div
        className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", tile)}
        aria-hidden="true"
      >
        <StatusIcon className="size-5" />
      </div>
      <span className="sr-only">Status: {label}.</span>

      {/* Title, course, due date */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="min-w-0 truncate text-body-md font-semibold text-on-surface">
            {assignment.title}
          </h3>
          <Badge variant="primary" className="max-w-48">
            <span className="min-w-0 truncate">{assignment.course.title}</span>
          </Badge>
        </div>
        <p
          className={cn(
            "mt-1.5 font-mono text-label-sm",
            isOverdue ? "text-error" : "text-on-surface-variant",
          )}
        >
          {assignment.due_at ? `Due ${formatDateTime(assignment.due_at)}` : "No due date"}
          {isOverdue ? " · Overdue" : ""}
        </p>
      </div>

      {/* Score + feedback + affordance */}
      <div className="flex shrink-0 items-center gap-3">
        {score != null ? (
          <div className="max-w-40 text-right sm:max-w-64">
            <span className="font-mono text-label-md text-on-surface">
              {score} / {assignment.max_score}
            </span>
            {feedback ? (
              <p
                className="mt-1 line-clamp-2 text-label-sm text-on-surface-variant italic"
                title={feedback}
              >
                {feedback}
              </p>
            ) : null}
          </div>
        ) : null}
        <ChevronRight
          className="size-5 text-outline transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

/** Loading row that mirrors the final list layout. */
function AssignmentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-card">
      <Skeleton className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-48 max-w-[55%]" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-56 max-w-[70%]" />
      </div>
      <Skeleton className="size-5 shrink-0" />
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  FileQuestion,
  ShieldCheck,
  Timer,
  Trophy,
  XCircle,
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
import { useQuizzes } from "@/hooks/use-assessments";
import { formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Quiz, QuizStatus } from "@/types";

const PER_PAGE = 10;

type StatusFilter = QuizStatus | "all";

const statusTabs: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
];

/** Icon tile treatment per quiz status. */
const statusConfig: Record<QuizStatus, { icon: LucideIcon; tile: string; label: string }> = {
  not_started: {
    icon: FileQuestion,
    tile: "bg-surface-container text-on-surface-variant",
    label: "Not started",
  },
  in_progress: { icon: Timer, tile: "bg-warning-container text-warning", label: "In progress" },
  passed: { icon: Trophy, tile: "bg-success-container text-success", label: "Passed" },
  failed: { icon: XCircle, tile: "bg-error-container text-error", label: "Failed" },
};

const emptyCopy: Record<StatusFilter, { icon: LucideIcon; title: string; description: string }> = {
  all: {
    icon: FileQuestion,
    title: "No quizzes yet",
    description:
      "When your instructors publish quizzes for your enrolled courses, they'll show up here.",
  },
  not_started: {
    icon: CheckCircle2,
    title: "Nothing waiting to start",
    description: "You've opened every quiz available to you — check back for new ones.",
  },
  in_progress: {
    icon: Timer,
    title: "No quizzes in progress",
    description: "Attempts you've started but not submitted will appear here.",
  },
  passed: {
    icon: Trophy,
    title: "No passes yet",
    description: "Pass a quiz and it will land here — your trophy shelf is waiting.",
  },
  failed: {
    icon: ShieldCheck,
    title: "No failed quizzes",
    description: "Great news — none of your quiz attempts have fallen short.",
  },
};

export default function QuizzesPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const quizzesQuery = useQuizzes({
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

  const quizzes = quizzesQuery.data?.data ?? [];
  const empty = emptyCopy[status];

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title="Quizzes"
        description="Test what you've learned — start new quizzes, finish attempts in progress, and track your best scores."
      />

      {/* Status filter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="mb-6 overflow-x-auto"
      >
        <Tabs value={status} onValueChange={handleStatusChange}>
          <TabsList aria-label="Filter quizzes by status">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      <motion.section
        aria-label="Quizzes"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        {quizzesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <QuizRowSkeleton key={index} />
            ))}
          </div>
        ) : quizzesQuery.isError ? (
          <ErrorState
            title="Couldn't load your quizzes"
            error={quizzesQuery.error}
            onRetry={() => {
              void quizzesQuery.refetch();
            }}
          />
        ) : !quizzesQuery.data || quizzesQuery.data.data.length === 0 ? (
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
                  View all quizzes
                </Button>
              )
            }
          />
        ) : (
          <>
            <p className="mb-4 font-mono text-label-sm text-on-surface-variant uppercase">
              {quizzesQuery.data.meta.total}{" "}
              {quizzesQuery.data.meta.total === 1 ? "quiz" : "quizzes"}
            </p>

            <ul
              className={cn(
                "space-y-3 transition-opacity duration-200",
                quizzesQuery.isPlaceholderData && quizzesQuery.isFetching && "opacity-60",
              )}
            >
              {quizzes.map((quiz, index) => (
                <motion.li
                  key={quiz.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.05, 0.35),
                    ease: "easeOut",
                  }}
                >
                  <QuizRow quiz={quiz} />
                </motion.li>
              ))}
            </ul>

            <PaginationBar
              meta={quizzesQuery.data.meta}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          </>
        )}
      </motion.section>
    </div>
  );
}

function QuizRow({ quiz }: { quiz: Quiz }) {
  const { icon: StatusIcon, tile, label } = statusConfig[quiz.status];

  return (
    <Link
      to={paths.quiz(quiz.id)}
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

      {/* Title, course, meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="min-w-0 truncate text-body-md font-semibold text-on-surface">
            {quiz.title}
          </h3>
          <Badge variant="primary" className="max-w-48">
            <span className="min-w-0 truncate">{quiz.course.title}</span>
          </Badge>
        </div>
        <p className="mt-1.5 font-mono text-label-sm text-on-surface-variant">
          {quiz.questions_count} {quiz.questions_count === 1 ? "question" : "questions"} ·{" "}
          {quiz.total_points} pts ·{" "}
          {quiz.time_limit_minutes != null ? formatDuration(quiz.time_limit_minutes) : "No limit"} ·{" "}
          {quiz.attempts_used}/{quiz.attempts_allowed} attempts
        </p>
      </div>

      {/* Best score + affordance */}
      <div className="flex shrink-0 items-center gap-4">
        {quiz.best_score != null ? (
          <span className="text-right">
            <span className="block font-mono text-label-md text-on-surface">
              {formatPercent(quiz.best_score)}
            </span>
            <span className="block font-mono text-label-sm text-on-surface-variant uppercase">
              Best
            </span>
          </span>
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
function QuizRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-card">
      <Skeleton className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-48 max-w-[55%]" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-72 max-w-[75%]" />
      </div>
      <Skeleton className="h-9 w-12 shrink-0" />
    </div>
  );
}

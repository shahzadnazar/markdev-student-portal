import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  ListChecks,
  Play,
  RotateCcw,
  Target,
  Trophy,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useQuiz, useQuizAttempts, useStartQuizAttempt } from "@/hooks/use-assessments";
import { formatDateTime, formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Quiz, QuizResult, QuizStatus } from "@/types";

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

const statusBadge: Record<QuizStatus, { variant: "neutral" | "warning" | "success" | "error"; label: string }> = {
  not_started: { variant: "neutral", label: "Not started" },
  in_progress: { variant: "warning", label: "In progress" },
  passed: { variant: "success", label: "Passed" },
  failed: { variant: "error", label: "Failed" },
};

export default function QuizDetailPage() {
  const { quizId = "" } = useParams();
  const navigate = useNavigate();

  const quizQuery = useQuiz(quizId);
  const attemptsQuery = useQuizAttempts(quizId);
  const startAttempt = useStartQuizAttempt(quizId);

  const handleStart = async () => {
    try {
      const attempt = await startAttempt.mutateAsync();
      void navigate(paths.quizTake(quizId), { state: { attempt } });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "We couldn't start the quiz right now. Please try again.",
      );
    }
  };

  if (quizQuery.isLoading) {
    return <QuizDetailSkeleton />;
  }

  if (quizQuery.isError) {
    return (
      <div>
        <BackLink />
        <PageHeader eyebrow="Learning" title="Quiz" />
        <ErrorState
          title="Couldn't load this quiz"
          error={quizQuery.error}
          onRetry={() => {
            void quizQuery.refetch();
          }}
        />
      </div>
    );
  }

  const quiz = quizQuery.data;
  if (!quiz) return null;

  return (
    <div>
      <BackLink />
      <PageHeader
        crumbs={[{ label: "Quizzes", to: "/quizzes" }, { label: quiz.title }]}
        title={quiz.title}
        description={quiz.description ?? undefined}
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <motion.div {...sectionMotion(0.05)} className="lg:col-span-2">
            <RulesCard quiz={quiz} />
          </motion.div>

          <motion.div {...sectionMotion(0.1)} className="lg:col-span-1">
            <StandingCard
              quiz={quiz}
              starting={startAttempt.isPending}
              onStart={() => {
                void handleStart();
              }}
            />
          </motion.div>
        </div>

        <motion.div {...sectionMotion(0.15)}>
          <AttemptHistoryCard quizId={quizId} attemptsQuery={attemptsQuery} />
        </motion.div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 text-on-surface-variant">
      <Link to={paths.quizzes}>
        <ChevronLeft aria-hidden="true" />
        Back to quizzes
      </Link>
    </Button>
  );
}

/* -------------------------------- Rules card ------------------------------ */

function RuleItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-surface-ice p-4", className)}>
      <dt className="flex items-center gap-1.5 font-mono text-label-sm text-on-surface-variant uppercase">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 text-body-md font-semibold text-on-surface">{value}</dd>
    </div>
  );
}

function availabilityValue(quiz: Quiz): string | null {
  const { available_from, available_until } = quiz;
  if (available_from && available_until) {
    return `${formatDateTime(available_from)} → ${formatDateTime(available_until)}`;
  }
  if (available_from) return `Opens ${formatDateTime(available_from)}`;
  if (available_until) return `Closes ${formatDateTime(available_until)}`;
  return null;
}

function RulesCard({ quiz }: { quiz: Quiz }) {
  const availability = availabilityValue(quiz);

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Before you start</p>
        <CardTitle>Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <RuleItem
            icon={Clock}
            label="Time limit"
            value={
              quiz.time_limit_minutes != null
                ? formatDuration(quiz.time_limit_minutes)
                : "No limit"
            }
          />
          <RuleItem
            icon={RotateCcw}
            label="Attempts"
            value={`${quiz.attempts_used} of ${quiz.attempts_allowed} used`}
          />
          <RuleItem icon={Target} label="Passing score" value={formatPercent(quiz.passing_score)} />
          <RuleItem icon={ListChecks} label="Questions" value={String(quiz.questions_count)} />
          <RuleItem
            icon={Award}
            label="Total points"
            value={`${quiz.total_points} ${quiz.total_points === 1 ? "pt" : "pts"}`}
          />
          {availability ? (
            <RuleItem
              icon={CalendarClock}
              label="Availability"
              value={availability}
              className="col-span-2 sm:col-span-1"
            />
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Standing / action card ------------------------ */

function StandingCard({
  quiz,
  starting,
  onStart,
}: {
  quiz: Quiz;
  starting: boolean;
  onStart: () => void;
}) {
  const badge = statusBadge[quiz.status];
  const attemptsLeft = Math.max(0, quiz.attempts_allowed - quiz.attempts_used);
  const canAttempt = attemptsLeft > 0 || quiz.status === "in_progress";
  const actionLabel =
    quiz.status === "in_progress"
      ? "Resume quiz"
      : quiz.attempts_used > 0
        ? "Retake quiz"
        : "Start quiz";
  const ActionIcon = quiz.attempts_used > 0 && quiz.status !== "in_progress" ? RotateCcw : Play;

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Your standing</p>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Attempt</CardTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-4 rounded-xl bg-surface-ice p-4">
          <div>
            <p className="font-mono text-label-sm text-on-surface-variant uppercase">Best score</p>
            <p className="mt-1 font-display text-headline-md text-on-surface">
              {quiz.best_score != null ? formatPercent(quiz.best_score) : "—"}
            </p>
          </div>
          {quiz.status === "passed" ? (
            <Trophy className="mb-1 size-8 text-success" aria-hidden="true" />
          ) : null}
        </div>

        <p className="font-mono text-label-sm text-on-surface-variant">
          {attemptsLeft > 0
            ? `${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} remaining`
            : "No attempts remaining"}
        </p>

        <Button size="lg" className="w-full" disabled={!canAttempt || starting} onClick={onStart}>
          {starting ? (
            <>
              <Spinner className="text-on-primary" aria-hidden="true" />
              Starting…
            </>
          ) : (
            <>
              <ActionIcon aria-hidden="true" />
              {actionLabel}
            </>
          )}
        </Button>

        {!canAttempt ? (
          <p className="text-center font-mono text-label-sm text-on-surface-variant">
            You've used all {quiz.attempts_allowed}{" "}
            {quiz.attempts_allowed === 1 ? "attempt" : "attempts"} for this quiz.
          </p>
        ) : quiz.status === "passed" ? (
          <p className="text-center font-mono text-label-sm text-on-surface-variant">
            You've already passed — retaking is optional.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Attempt history ----------------------------- */

function AttemptHistoryCard({
  quizId,
  attemptsQuery,
}: {
  quizId: string;
  attemptsQuery: ReturnType<typeof useQuizAttempts>;
}) {
  const attempts = attemptsQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">History</p>
        <CardTitle>Attempt history</CardTitle>
      </CardHeader>
      <CardContent>
        {attemptsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : attemptsQuery.isError ? (
          <ErrorState
            title="Couldn't load your attempts"
            error={attemptsQuery.error}
            onRetry={() => {
              void attemptsQuery.refetch();
            }}
            className="py-10"
          />
        ) : attempts.length === 0 ? (
          <EmptyState
            icon={History}
            title="No attempts yet"
            description="Your submitted attempts and their scores will appear here."
            className="py-10"
          />
        ) : (
          <div>
            {/* Column labels (aligned with the row layout below) */}
            <div
              className="mb-2 hidden items-center gap-4 px-4 font-mono text-label-sm text-on-surface-variant uppercase sm:flex"
              aria-hidden="true"
            >
              <span className="min-w-0 flex-1">Submitted</span>
              <span className="w-24 text-right">Score</span>
              <span className="w-16 text-right">Percent</span>
              <span className="w-20 text-center">Result</span>
              <span className="size-5" />
            </div>

            <ul className="space-y-2">
              {attempts.map((attempt) => (
                <li key={attempt.id}>
                  <AttemptRow quizId={quizId} attempt={attempt} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttemptRow({ quizId, attempt }: { quizId: string; attempt: QuizResult }) {
  return (
    <Link
      to={paths.quizResult(quizId, attempt.id)}
      className="group flex items-center gap-4 rounded-xl border border-outline-variant/60 px-4 py-3.5 transition-colors duration-150 hover:border-primary/40 hover:bg-surface-ice"
    >
      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-on-surface">
        {formatDateTime(attempt.submitted_at)}
      </span>
      <span className="hidden w-24 text-right font-mono text-label-md text-on-surface sm:block">
        {attempt.score} / {attempt.max_score}
      </span>
      <span className="w-16 text-right font-mono text-label-md text-on-surface">
        {formatPercent(attempt.percent)}
      </span>
      <span className="w-20 text-center">
        <Badge variant={attempt.passed ? "success" : "error"}>
          {attempt.passed ? "Passed" : "Failed"}
        </Badge>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-outline transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

/** Loading layout that mirrors the final page structure. */
function QuizDetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-40" />

      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-1/2 max-w-md" />
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-24" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

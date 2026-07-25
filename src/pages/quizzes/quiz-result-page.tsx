import { motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  FileQuestion,
  Lightbulb,
  RotateCcw,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuizResult } from "@/hooks/use-assessments";
import { formatDateTime, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { QuizResult, QuizResultQuestion } from "@/types";

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

export default function QuizResultPage() {
  const { quizId = "", attemptId = "" } = useParams();
  const resultQuery = useQuizResult(quizId, attemptId);

  if (resultQuery.isLoading) {
    return <QuizResultSkeleton />;
  }

  if (resultQuery.isError) {
    return (
      <div>
        <BackLink quizId={quizId} />
        <PageHeader eyebrow="Quiz result" title="Result" />
        <ErrorState
          title="Couldn't load this result"
          error={resultQuery.error}
          onRetry={() => {
            void resultQuery.refetch();
          }}
        />
      </div>
    );
  }

  const result = resultQuery.data;
  if (!result) return null;

  const questions = [...result.questions].sort((a, b) => a.position - b.position);

  return (
    <div>
      <BackLink quizId={quizId} />
      <PageHeader crumbs={[{ label: "Quizzes", to: "/quizzes" }, { label: result.quiz_title }, { label: "Result" }]} title={result.quiz_title} />

      <motion.div {...sectionMotion(0.05)}>
        <HeroCard result={result} quizId={quizId} />
      </motion.div>

      <section aria-label="Question review" className="mt-8">
        <motion.h2
          {...sectionMotion(0.1)}
          className="mb-4 font-mono text-label-sm text-on-surface-variant uppercase"
        >
          Question review · {questions.length}{" "}
          {questions.length === 1 ? "question" : "questions"}
        </motion.h2>

        {questions.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title="No question breakdown"
            description="A per-question review isn't available for this attempt."
          />
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <motion.div key={question.id} {...sectionMotion(Math.min(0.15 + index * 0.05, 0.5))}>
                <QuestionReviewCard question={question} index={index} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink({ quizId }: { quizId: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 text-on-surface-variant">
      <Link to={paths.quiz(quizId)}>
        <ChevronLeft aria-hidden="true" />
        Back to quiz
      </Link>
    </Button>
  );
}

/* --------------------------------- Hero card ------------------------------- */

function HeroCard({ result, quizId }: { result: QuizResult; quizId: string }) {
  const correctCount = result.questions.filter((question) => question.is_correct).length;

  return (
    <Card className="relative overflow-hidden">
      {/* Brand-gradient accent celebrates a pass */}
      {result.passed ? (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" aria-hidden="true" />
      ) : null}

      <CardContent className="flex flex-col gap-8 pt-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant={result.passed ? "success" : "error"}>
            {result.passed ? (
              <Trophy aria-hidden="true" />
            ) : (
              <XCircle aria-hidden="true" />
            )}
            {result.passed ? "Passed" : "Failed"}
          </Badge>

          <p className="mt-4 font-display text-headline-md text-on-surface">
            {formatPercent(result.percent)}
          </p>
          <p className="mt-1 font-mono text-label-md text-on-surface-variant">
            {result.score} / {result.max_score} points · {correctCount} of{" "}
            {result.questions.length} correct
          </p>

          <Progress
            value={result.percent}
            className="mt-4 max-w-sm"
            aria-label={`Score: ${formatPercent(result.percent)}`}
          />
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          {result.course ? (
            <Badge variant="primary" className="max-w-64">
              <span className="min-w-0 truncate">{result.course.title}</span>
            </Badge>
          ) : null}
          <p className="font-mono text-label-sm text-on-surface-variant">
            Submitted {formatDateTime(result.submitted_at)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link to={paths.quiz(quizId)}>
                <ChevronLeft aria-hidden="true" />
                Back to quiz
              </Link>
            </Button>
            {!result.passed ? (
              <Button asChild>
                <Link to={paths.quiz(quizId)}>
                  <RotateCcw aria-hidden="true" />
                  Retake quiz
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Question review ----------------------------- */

function QuestionReviewCard({
  question,
  index,
}: {
  question: QuizResultQuestion;
  index: number;
}) {
  const isChoice = question.type !== "short_answer";
  const notAnswered = isChoice
    ? question.selected_option_ids.length === 0
    : !question.answer_text?.trim();

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-label-sm text-on-surface-variant uppercase">
          Question {index + 1} · {question.points_awarded}/{question.points}{" "}
          {question.points === 1 ? "pt" : "pts"}
        </p>
        {question.is_correct ? (
          <span className="flex items-center gap-1.5 font-mono text-label-sm text-success uppercase">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Correct
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-mono text-label-sm text-error uppercase">
            <XCircle className="size-4" aria-hidden="true" />
            Incorrect
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-body-lg text-on-surface">{question.prompt}</p>

        {isChoice ? (
          <ul className="space-y-2.5">
            {question.options.map((option) => {
              const isCorrectOption = question.correct_option_ids.includes(option.id);
              const isSelected = question.selected_option_ids.includes(option.id);
              const isWrongSelection = isSelected && !isCorrectOption;
              return (
                <li
                  key={option.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3",
                    isCorrectOption
                      ? "border-success bg-success-container/40"
                      : isWrongSelection
                        ? "border-error bg-error-container/40"
                        : "border-outline-variant/60",
                  )}
                >
                  {isCorrectOption ? (
                    <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : isWrongSelection ? (
                    <X className="size-4 shrink-0 text-error" aria-hidden="true" />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 text-body-sm text-on-surface">
                    {option.text}
                  </span>
                  {isSelected ? (
                    <Badge variant={isCorrectOption ? "success" : "error"}>Your answer</Badge>
                  ) : isCorrectOption ? (
                    <span className="font-mono text-label-sm text-success uppercase">Correct</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div>
            <p className="font-mono text-label-sm text-on-surface-variant uppercase">
              Your answer
            </p>
            <blockquote
              className={cn(
                "mt-2 rounded-xl border-l-4 bg-surface-container-low p-4 text-body-md text-on-surface",
                question.is_correct ? "border-success" : "border-error",
              )}
            >
              {question.answer_text?.trim() ? (
                question.answer_text
              ) : (
                <span className="text-on-surface-variant italic">No answer provided</span>
              )}
            </blockquote>
          </div>
        )}

        {notAnswered && isChoice ? (
          <p className="font-mono text-label-sm text-on-surface-variant">
            You didn't answer this question.
          </p>
        ) : null}

        {question.explanation ? (
          <Alert variant="info">
            <Lightbulb aria-hidden="true" />
            <AlertTitle>Explanation</AlertTitle>
            <AlertDescription>{question.explanation}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

/** Loading layout that mirrors the final page structure. */
function QuizResultSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-32" />

      <div className="mb-6 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-2 w-72 max-w-full rounded-full" />
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-56" />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        <Skeleton className="h-4 w-44" />
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

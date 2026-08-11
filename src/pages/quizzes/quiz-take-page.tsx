import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileQuestion, Send } from "lucide-react";
import { Link, useBlocker, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageLoader } from "@/components/shared/page-loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useQuiz, useStartQuizAttempt, useSubmitQuizAttempt } from "@/hooks/use-assessments";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Question, QuizAnswerPayload, QuizAttempt, SubmitQuizAttemptPayload } from "@/types";
import { QuestionCard, type QuestionAnswer } from "./question-card";
import { QuizTimer } from "./quiz-timer";

/**
 * Immersive quiz-taking screen — rendered outside the app shell so the
 * student can focus. The attempt normally arrives via navigation state from
 * the detail page; landing here directly auto-starts a fresh attempt.
 */
export default function QuizTakePage() {
  const { quizId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateAttempt = (location.state as { attempt?: QuizAttempt } | null)?.attempt;
  const [attempt, setAttempt] = useState<QuizAttempt | null>(
    stateAttempt && String(stateAttempt.quiz_id) === quizId ? stateAttempt : null,
  );

  const quizQuery = useQuiz(quizId);
  const startAttempt = useStartQuizAttempt(quizId);
  const submitAttempt = useSubmitQuizAttempt(quizId);
  const { mutate: startMutate } = startAttempt;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Guards: auto-start must fire once (Strict Mode double-mounts effects),
  // and the attempt must never be submitted twice (timer + manual race).
  const autoStartedRef = useRef(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (attempt || autoStartedRef.current) return;
    autoStartedRef.current = true;
    startMutate(undefined, {
      onSuccess: (started) => {
        setAttempt(started);
      },
    });
  }, [attempt, startMutate]);

  const questions = useMemo(
    () => (attempt ? [...attempt.questions].sort((a, b) => a.position - b.position) : []),
    [attempt],
  );

  const isAnswered = useCallback(
    (question: Question) => {
      const answer = answers[question.id];
      if (!answer) return false;
      if (question.type === "short_answer") return (answer.answer_text?.trim().length ?? 0) > 0;
      return (answer.selected_option_ids?.length ?? 0) > 0;
    },
    [answers],
  );

  const answeredCount = questions.filter(isAnswered).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSubmit = useCallback(
    (reason: "manual" | "timeout") => {
      if (!attempt || submittedRef.current) return;
      submittedRef.current = true;

      const payload: SubmitQuizAttemptPayload = {
        answers: questions.flatMap<QuizAnswerPayload>((question) => {
          const answer = answers[question.id];
          if (!answer) return [];
          if (question.type === "short_answer") {
            const text = answer.answer_text?.trim();
            return text ? [{ question_id: question.id, answer_text: text }] : [];
          }
          const ids = answer.selected_option_ids ?? [];
          return ids.length > 0 ? [{ question_id: question.id, selected_option_ids: ids }] : [];
        }),
      };

      submitAttempt.mutate(
        { attemptId: attempt.id, payload },
        {
          onSuccess: (result) => {
            if (reason === "manual") {
              toast.success("Quiz submitted — here are your results.");
            }
            void navigate(paths.quizResult(quizId, result.id), { replace: true });
          },
          onError: (error) => {
            submittedRef.current = false;
            setConfirmOpen(false);
            toast.error(
              error instanceof ApiError
                ? error.message
                : "We couldn't submit your quiz. Please try again.",
            );
          },
        },
      );
    },
    [answers, attempt, navigate, questions, quizId, submitAttempt],
  );

  const handleExpire = useCallback(() => {
    setConfirmOpen(false);
    toast.error("Time is up — submitting your answers");
    handleSubmit("timeout");
  }, [handleSubmit]);

  // Once the attempt is running, the browser back button (and any in-app
  // navigation) is blocked until the quiz is submitted — leaving mid-attempt
  // would burn the attempt with a zero score.
  const attemptActive = attempt !== null && !submitAttempt.isPending && !submittedRef.current;
  const blocker = useBlocker(
    useCallback(() => attemptActive && !submittedRef.current, [attemptActive]),
  );

  useEffect(() => {
    if (!attemptActive) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [attemptActive]);

  /* ------------------------- Starting / failure states ------------------------ */

  if (!attempt) {
    if (startAttempt.isError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-ice px-4 py-10">
          <div className="w-full max-w-lg space-y-4">
            <ErrorState
              title="Couldn't start the quiz"
              error={startAttempt.error}
              onRetry={() => {
                startAttempt.reset();
                startMutate(undefined, {
                  onSuccess: (started) => {
                    setAttempt(started);
                  },
                });
              }}
            />
            <Button asChild variant="secondary" className="w-full">
              <Link to={paths.quiz(quizId)}>
                <ChevronLeft aria-hidden="true" />
                Back to quiz overview
              </Link>
            </Button>
          </div>
        </div>
      );
    }
    return <PageLoader fullScreen label="Preparing your attempt" />;
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-ice px-4 py-10">
        <EmptyState
          icon={FileQuestion}
          title="This quiz has no questions"
          description="The instructor hasn't added any questions to this quiz yet. Check back later."
          action={
            <Button asChild variant="secondary">
              <Link to={paths.quiz(quizId)}>
                <ChevronLeft aria-hidden="true" />
                Back to quiz overview
              </Link>
            </Button>
          }
          className="w-full max-w-lg"
        />
      </div>
    );
  }

  /* --------------------------------- Taking --------------------------------- */

  const safeIndex = Math.min(current, questions.length - 1);
  const question = questions[safeIndex];
  const isLast = safeIndex === questions.length - 1;

  return (
    <div className="flex min-h-screen flex-col bg-surface-ice">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-outline-variant/40 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-label-sm text-primary uppercase">Quiz in progress</p>
            {quizQuery.isPending ? (
              <Skeleton className="mt-0.5 h-5 w-40" />
            ) : (
              <h1 className="truncate font-display text-body-md font-semibold text-on-surface">
                {quizQuery.data?.title ?? "Quiz"}
              </h1>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <p
              className="font-mono text-label-md text-on-surface tabular-nums"
              aria-label={`Question ${safeIndex + 1} of ${questions.length}`}
            >
              {safeIndex + 1} / {questions.length}
            </p>
            {attempt.expires_at ? (
              <QuizTimer expiresAt={attempt.expires_at} onExpire={handleExpire} />
            ) : null}
          </div>
        </div>
        <Progress
          value={(answeredCount / questions.length) * 100}
          className="h-1 rounded-none"
          aria-label={`${answeredCount} of ${questions.length} questions answered`}
        />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        {/* Current question — remounts (and re-animates) per question */}
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <QuestionCard
            question={question}
            index={safeIndex}
            answer={answers[question.id]}
            onChange={(next) => {
              setAnswers((prev) => ({ ...prev, [question.id]: next }));
            }}
          />
        </motion.div>

        {/* Numbered pill navigator */}
        <nav
          aria-label="Question navigator"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {questions.map((item, index) => {
            const answered = isAnswered(item);
            const isCurrent = index === safeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Go to question ${index + 1}${answered ? " (answered)" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full font-mono text-label-sm transition-all duration-150",
                  answered
                    ? "bg-primary text-on-primary hover:bg-primary-deep"
                    : "border border-outline-variant bg-white text-on-surface-variant hover:border-primary/50 hover:text-primary",
                  isCurrent && "ring-2 ring-primary/40 ring-offset-2 ring-offset-surface-ice",
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </nav>

        {/* Prev / Next / Submit */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={safeIndex === 0}
            onClick={() => setCurrent((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>

          {isLast ? (
            <Button onClick={() => setConfirmOpen(true)} disabled={submitAttempt.isPending}>
              <Send aria-hidden="true" />
              Submit quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </div>
      </main>

      {/* Submit confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit quiz?</DialogTitle>
            <DialogDescription>
              Once submitted, your answers are final for this attempt.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-success-container/50 p-4 text-center">
              <p className="font-display text-headline-md text-on-surface">{answeredCount}</p>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase">Answered</p>
            </div>
            <div
              className={cn(
                "rounded-xl p-4 text-center",
                unansweredCount > 0 ? "bg-warning-container/60" : "bg-surface-container-low",
              )}
            >
              <p className="font-display text-headline-md text-on-surface">{unansweredCount}</p>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase">
                Unanswered
              </p>
            </div>
          </div>

          {unansweredCount > 0 ? (
            <p className="font-mono text-label-sm text-warning">
              Unanswered questions score zero points.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={submitAttempt.isPending}
            >
              Keep working
            </Button>
            <Button onClick={() => handleSubmit("manual")} disabled={submitAttempt.isPending}>
              {submitAttempt.isPending ? (
                <>
                  <Spinner className="text-on-primary" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send aria-hidden="true" />
                  Submit quiz
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Back / leave attempt blocked */}
      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You're in the middle of a quiz</DialogTitle>
            <DialogDescription>
              You can't go back or leave this page until you submit. If you leave now, your
              answers will be submitted as they are — unanswered questions score zero.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => blocker.reset?.()}>
              Keep taking the quiz
            </Button>
            <Button
              onClick={() => {
                blocker.reset?.();
                handleSubmit("manual");
              }}
              disabled={submitAttempt.isPending}
            >
              <Send aria-hidden="true" />
              Submit &amp; leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import type { ChangeEvent } from "react";
import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  FileText,
  Send,
  Upload,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/api/client";
import { ErrorState } from "@/components/shared/error-state";
import { FormError, FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAssignment, useSubmitAssignment } from "@/hooks/use-assessments";
import { formatBytes, formatDateTime, formatPercent } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { Assignment } from "@/types";

/** Rich-text wrapper classes for API-provided HTML (see design notes). */
const richTextClassName =
  "space-y-4 text-body-md text-on-surface [&_a]:text-primary [&_a]:underline [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-xl [&_pre]:bg-inverse-surface [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-body-sm [&_pre]:text-inverse-on-surface [&_pre]:overflow-x-auto [&_code]:font-mono";

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

export default function AssignmentDetailPage() {
  const { assignmentId = "" } = useParams();

  const assignmentQuery = useAssignment(assignmentId);
  const submitAssignment = useSubmitAssignment(assignmentId);

  if (assignmentQuery.isLoading) {
    return <AssignmentDetailSkeleton />;
  }

  if (assignmentQuery.isError) {
    return (
      <div>
        <BackLink />
        <PageHeader eyebrow="Learning" title="Assignment" />
        <ErrorState
          title="Couldn't load this assignment"
          error={assignmentQuery.error}
          onRetry={() => {
            void assignmentQuery.refetch();
          }}
        />
      </div>
    );
  }

  const assignment = assignmentQuery.data;
  if (!assignment) return null;

  const canSubmit =
    assignment.status === "pending" ||
    assignment.status === "overdue" ||
    assignment.status === "returned";

  return (
    <div>
      <BackLink />
      <PageHeader
        crumbs={[{ label: "Assignments", to: "/assignments" }, { label: assignment.title }]}
        title={assignment.title}
        description={assignment.description ?? undefined}
      />

      <div className="space-y-6">
        <motion.div {...sectionMotion(0.05)}>
          <StatusBanner assignment={assignment} />
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <motion.div {...sectionMotion(0.1)} className="lg:col-span-2">
            <BriefCard assignment={assignment} />
          </motion.div>

          <motion.div {...sectionMotion(0.15)} className="lg:col-span-1">
            {canSubmit ? (
              <SubmissionFormCard assignment={assignment} mutation={submitAssignment} />
            ) : (
              <SubmissionSummaryCard assignment={assignment} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 text-on-surface-variant">
      <Link to={paths.assignments}>
        <ChevronLeft aria-hidden="true" />
        Back to assignments
      </Link>
    </Button>
  );
}

/* ------------------------------ Status banner ----------------------------- */

function StatusBanner({ assignment }: { assignment: Assignment }) {
  const submission = assignment.submission;

  switch (assignment.status) {
    case "pending":
      return (
        <Alert variant="info">
          <Clock aria-hidden="true" />
          <AlertTitle>Awaiting your submission</AlertTitle>
          <AlertDescription>
            {assignment.due_at
              ? `This assignment is due ${formatDateTime(assignment.due_at)}.`
              : "This assignment has no due date — submit whenever you're ready."}
          </AlertDescription>
        </Alert>
      );
    case "overdue":
      return (
        <Alert variant="error">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Past due</AlertTitle>
          <AlertDescription>
            {assignment.due_at ? `The deadline was ${formatDateTime(assignment.due_at)}. ` : ""}
            You can still submit, but your work will be flagged as late.
          </AlertDescription>
        </Alert>
      );
    case "submitted":
      return (
        <Alert variant="info">
          <Send aria-hidden="true" />
          <AlertTitle>Submitted — awaiting grading</AlertTitle>
          <AlertDescription>
            {submission
              ? `You handed this in ${formatDateTime(submission.submitted_at)}. We'll let you know as soon as it's graded.`
              : "Your work is in. We'll let you know as soon as it's graded."}
          </AlertDescription>
        </Alert>
      );
    case "returned":
      return (
        <Alert variant="warning">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Returned for changes</AlertTitle>
          <AlertDescription>
            {submission?.feedback
              ? `Your instructor sent this back with feedback: "${submission.feedback}" — update your work below and resubmit.`
              : "Your instructor sent this back for changes — update your work below and resubmit."}
          </AlertDescription>
        </Alert>
      );
    case "graded":
      return (
        <Alert variant="success">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Graded</AlertTitle>
          <AlertDescription>
            {submission?.score != null
              ? `You scored ${submission.score} / ${assignment.max_score}.`
              : "Your submission has been graded."}
            {submission?.graded_at ? ` Graded ${formatDateTime(submission.graded_at)}.` : ""}
          </AlertDescription>
        </Alert>
      );
    default:
      return null;
  }
}

/* -------------------------------- Brief card ------------------------------ */

function BriefCard({ assignment }: { assignment: Assignment }) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-label-sm text-primary uppercase">Brief</p>
          <CardTitle className="mt-1.5">Instructions</CardTitle>
        </div>
        <p className="font-mono text-label-sm text-on-surface-variant">
          Worth {assignment.max_score} {assignment.max_score === 1 ? "point" : "points"}
        </p>
      </CardHeader>
      <CardContent>
        {assignment.instructions ? (
          <div
            className={richTextClassName}
            dangerouslySetInnerHTML={{ __html: assignment.instructions }}
          />
        ) : (
          <p className="text-body-md text-on-surface-variant">
            {assignment.description ??
              "The instructor hasn't added detailed instructions for this assignment yet."}
          </p>
        )}

        {assignment.attachments.length > 0 ? (
          <div className="mt-8 border-t border-outline-variant/40 pt-6">
            <h3 className="font-mono text-label-sm text-on-surface-variant uppercase">
              Attachments
            </h3>
            <ul className="mt-3 space-y-2">
              {assignment.attachments.map((resource) => (
                <li key={resource.id}>
                  <a
                    href={resource.file_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-outline-variant/60 px-4 py-3 transition-colors duration-150 hover:border-primary/40 hover:bg-surface-ice"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="size-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-medium text-on-surface">
                        {resource.name}
                      </p>
                      <p className="font-mono text-label-sm text-on-surface-variant">
                        {formatBytes(resource.size_bytes)}
                      </p>
                    </div>
                    <Download
                      className="size-4 shrink-0 text-outline transition-colors duration-150 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ---------------------------- Submission (form) --------------------------- */

const submissionSchema = z
  .object({
    content: z.string(),
    file: z.instanceof(File, { message: "Attach a valid file." }).nullable(),
  })
  .refine((values) => values.content.trim().length > 0 || values.file !== null, {
    message: "Write a response or attach a file — at least one is required.",
    path: ["content"],
  });

type SubmissionFormValues = z.infer<typeof submissionSchema>;

function SubmissionFormCard({
  assignment,
  mutation,
}: {
  assignment: Assignment;
  mutation: ReturnType<typeof useSubmitAssignment>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isOverdue = assignment.status === "overdue";
  const isResubmission = assignment.status === "returned";

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { content: assignment.submission?.content ?? "", file: null },
  });

  const file = watch("file");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setValue("file", selected, { shouldValidate: isSubmitted });
  };

  const clearFile = () => {
    setValue("file", null, { shouldValidate: isSubmitted });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = handleSubmit((values) => {
    const content = values.content.trim();
    mutation.mutate(
      { content: content || undefined, file: values.file ?? undefined },
      {
        onSuccess: () => {
          toast.success(
            isResubmission
              ? "Resubmitted — your instructor will take another look."
              : isOverdue
                ? "Your work is in — it has been flagged as a late submission."
                : "Your work has been submitted. Good luck!",
          );
          reset();
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            if (error.status === 422) {
              const contentMessage = error.errors.content?.[0];
              const fileMessage = error.errors.file?.[0];
              if (contentMessage) setError("content", { message: contentMessage });
              if (fileMessage) setError("file", { message: fileMessage });
            }
            setError("root", { message: error.message });
            toast.error(error.message);
          } else {
            setError("root", {
              message: "We couldn't submit your work right now. Please try again.",
            });
            toast.error("We couldn't submit your work right now. Please try again.");
          }
        },
      },
    );
  });

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Submission</p>
        <CardTitle>{isResubmission ? "Resubmit your work" : "Submit your work"}</CardTitle>
        <CardDescription>
          {isResubmission
            ? "Apply your instructor's feedback, then send it back for grading."
            : "Write a response, attach a file, or both."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={(event) => void onSubmit(event)} noValidate>
          <FormError message={errors.root?.message} />

          <FormField
            label="Response"
            htmlFor="content"
            error={errors.content?.message}
            hint="Optional if you attach a file."
          >
            <Textarea
              id="content"
              rows={6}
              placeholder="Type your answer, notes, or a link to your work…"
              aria-invalid={errors.content ? true : undefined}
              aria-describedby={errors.content ? "content-error" : undefined}
              {...register("content")}
            />
          </FormField>

          <FormField
            label="Attachment"
            htmlFor="file"
            error={errors.file?.message}
            hint="One file, optional if you've written a response."
          >
            <input
              ref={fileInputRef}
              id="file"
              type="file"
              className="sr-only"
              aria-invalid={errors.file ? true : undefined}
              aria-describedby={errors.file ? "file-error" : undefined}
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-ice px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-medium text-on-surface">{file.name}</p>
                  <p className="font-mono text-label-sm text-on-surface-variant">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={clearFile}
                  aria-label="Remove the attached file"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-6 text-body-sm text-on-surface-variant transition-colors duration-150 hover:border-primary/50 hover:bg-surface-ice hover:text-primary"
              >
                <Upload className="size-4" aria-hidden="true" />
                Choose a file to attach
              </button>
            )}
          </FormField>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Spinner className="text-on-primary" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                Submit assignment
              </>
            )}
          </Button>

          {isOverdue ? (
            <p className="text-center font-mono text-label-sm text-error">
              This submission will be flagged as late.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Submission (summary) -------------------------- */

function SubmissionSummaryCard({ assignment }: { assignment: Assignment }) {
  const submission = assignment.submission;

  if (!submission) {
    return (
      <Card>
        <CardHeader>
          <p className="font-mono text-label-sm text-primary uppercase">Submission</p>
          <CardTitle>Your submission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-on-surface-variant">
            Your submission is recorded, but its details aren't available right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  const score = submission.score;

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Submission</p>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Your submission</CardTitle>
          {submission.is_late ? <Badge variant="error">Late</Badge> : null}
        </div>
        <CardDescription>Submitted {formatDateTime(submission.submitted_at)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {submission.content ? (
          <div>
            <h3 className="font-mono text-label-sm text-on-surface-variant uppercase">Response</h3>
            <p className="mt-2 rounded-xl bg-surface-container-low p-4 text-body-sm whitespace-pre-wrap text-on-surface">
              {submission.content}
            </p>
          </div>
        ) : null}

        {submission.file_url ? (
          <div>
            <h3 className="font-mono text-label-sm text-on-surface-variant uppercase">File</h3>
            <a
              href={submission.file_url}
              download
              target="_blank"
              rel="noreferrer"
              className="group mt-2 flex items-center gap-3 rounded-xl border border-outline-variant/60 px-4 py-3 transition-colors duration-150 hover:border-primary/40 hover:bg-surface-ice"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-4 text-primary" aria-hidden="true" />
              </div>
              <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-on-surface">
                {submission.file_name ?? "Submitted file"}
              </span>
              <Download
                className="size-4 shrink-0 text-outline transition-colors duration-150 group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
          </div>
        ) : null}

        {!submission.content && !submission.file_url ? (
          <p className="text-body-sm text-on-surface-variant">
            No written response or file was attached to this submission.
          </p>
        ) : null}

        {assignment.status === "graded" && score != null ? (
          <ScorePanel
            score={score}
            maxScore={assignment.max_score}
            feedback={submission.feedback}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ScorePanel({
  score,
  maxScore,
  feedback,
}: {
  score: number;
  maxScore: number;
  feedback: string | null;
}) {
  const percent = maxScore > 0 ? Math.min(100, Math.max(0, (score / maxScore) * 100)) : 0;

  return (
    <div className="border-t border-outline-variant/40 pt-5">
      <h3 className="font-mono text-label-sm text-on-surface-variant uppercase">Score</h3>
      <p className="mt-2 font-display text-headline-md text-on-surface">
        {score}
        <span className="text-headline-md text-on-surface-variant"> / {maxScore}</span>
      </p>
      <div className="mt-3">
        <Progress value={percent} aria-label={`Score: ${formatPercent(percent)}`} />
        <p className="mt-1.5 text-right font-mono text-label-sm text-on-surface-variant">
          {formatPercent(percent)}
        </p>
      </div>
      {feedback ? (
        <div className="mt-5">
          <h3 className="font-mono text-label-sm text-on-surface-variant uppercase">Feedback</h3>
          <blockquote className="mt-2 border-l-4 border-primary pl-4 text-body-md text-on-surface-variant italic">
            {feedback}
          </blockquote>
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

/** Loading layout that mirrors the final page structure. */
function AssignmentDetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-44" />

      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-1/2 max-w-md" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-44" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-4 h-14 w-full rounded-xl" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-40" />
              <Skeleton className="mt-2 h-24 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

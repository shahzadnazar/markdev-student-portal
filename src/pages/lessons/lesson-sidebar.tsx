import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  FileText,
  FolderDown,
  ListChecks,
  PlayCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { LessonType, Module } from "@/types";

const lessonTypeIcon: Record<LessonType, LucideIcon> = {
  video: PlayCircle,
  article: FileText,
  quiz: FileQuestion,
  assignment: ClipboardList,
  resource: FolderDown,
};

export interface CurriculumProps {
  courseId: string;
  currentLessonId: number;
  modules: Module[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  /** Course progress 0–100, when known. */
  progressPercent?: number;
  /** Called after a lesson row is chosen (closes the mobile dialog). */
  onNavigate?: () => void;
}

function CurriculumSkeleton() {
  return (
    <div className="space-y-6 p-3" aria-hidden="true">
      {[0, 1, 2].map((block) => (
        <div key={block} className="space-y-2">
          <Skeleton className="mx-3 h-3 w-24" />
          <Skeleton className="mx-3 h-4 w-40" />
          <div className="space-y-1.5 pt-1">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="mx-3 h-9" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Module + lesson list shared by the desktop rail and the mobile dialog. */
export function CurriculumContent({
  courseId,
  currentLessonId,
  modules,
  isPending,
  isError,
  error,
  onRetry,
  onNavigate,
}: CurriculumProps) {
  if (isPending) return <CurriculumSkeleton />;

  if (isError) {
    return (
      <div className="p-3">
        <ErrorState error={error} title="Curriculum failed to load" onRetry={onRetry} className="py-10" />
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="p-3">
        <EmptyState
          icon={ListChecks}
          title="No curriculum yet"
          description="The instructor hasn't published any modules for this course."
          className="py-10"
        />
      </div>
    );
  }

  return (
    <nav aria-label="Course curriculum" className="p-3">
      {modules.map((module, index) => {
        const completedCount = module.lessons.filter((lesson) => lesson.is_completed).length;
        return (
          <section key={module.id} aria-label={module.title} className="mb-6 last:mb-0">
            <div className="px-3">
              <p className="font-mono text-label-sm text-outline uppercase">
                Module {String(index + 1).padStart(2, "0")} · {completedCount}/{module.lessons.length}
              </p>
              <h3 className="mt-0.5 font-display text-body-sm font-semibold text-on-surface">
                {module.title}
              </h3>
            </div>
            <ul className="mt-2 space-y-0.5">
              {module.lessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const Icon = lessonTypeIcon[lesson.type];
                return (
                  <li key={lesson.id}>
                    <Link
                      to={paths.lesson(courseId, lesson.id)}
                      onClick={onNavigate}
                      aria-current={isCurrent ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm transition-colors duration-150",
                        isCurrent
                          ? "bg-primary/[0.06] font-medium text-primary"
                          : "text-on-surface-variant hover:bg-surface-ice hover:text-on-surface",
                      )}
                    >
                      {/* Current lesson: 4px bar on the left edge, mirroring the shell sidebar. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-1.5 bottom-1.5 -left-3 w-1 rounded-r-full bg-primary transition-opacity",
                          isCurrent ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <Icon
                        className={cn(
                          "size-[18px] shrink-0 transition-colors",
                          isCurrent ? "text-primary" : "text-outline group-hover:text-on-surface-variant",
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                      {lesson.is_completed ? (
                        <>
                          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                          <span className="sr-only">Completed</span>
                        </>
                      ) : (
                        <span className="shrink-0 font-mono text-label-sm text-outline">
                          {formatDuration(lesson.duration_minutes)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}

function CurriculumHeader({
  lessonsTotal,
  progressPercent,
}: {
  lessonsTotal: number | null;
  progressPercent?: number;
}) {
  return (
    <div className="border-b border-primary/10 px-6 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-label-sm text-primary uppercase">Curriculum</p>
        {lessonsTotal != null ? (
          <span className="font-mono text-label-sm text-outline uppercase">
            {lessonsTotal} {lessonsTotal === 1 ? "lesson" : "lessons"}
          </span>
        ) : null}
      </div>
      {progressPercent != null ? (
        <div className="mt-3">
          <Progress value={progressPercent} aria-label="Course progress" />
          <p className="mt-1.5 font-mono text-label-sm text-on-surface-variant uppercase">
            {formatPercent(progressPercent)} complete
          </p>
        </div>
      ) : null}
    </div>
  );
}

function countLessons(modules: Module[] | undefined): number | null {
  if (!modules) return null;
  return modules.reduce((total, module) => total + module.lessons.length, 0);
}

/** Sticky desktop curriculum rail (hidden below xl). */
export function CurriculumRail(props: CurriculumProps) {
  return (
    <aside className="hidden xl:block" aria-label="Course curriculum">
      <div className="sticky top-24 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-card">
        <CurriculumHeader
          lessonsTotal={countLessons(props.modules)}
          progressPercent={props.progressPercent}
        />
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <CurriculumContent {...props} />
        </div>
      </div>
    </aside>
  );
}

/** Mobile/tablet disclosure — the rail collapses into an accessible dialog. */
export function CurriculumDialog(props: CurriculumProps) {
  const [open, setOpen] = useState(false);
  const lessonsTotal = countLessons(props.modules);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-5 py-4 text-left shadow-card transition-shadow duration-150 hover:shadow-elevated"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ListChecks className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-body-md font-semibold text-on-surface">
              Course curriculum
            </span>
            <span className="mt-0.5 block font-mono text-label-sm text-on-surface-variant uppercase">
              {lessonsTotal != null ? `${lessonsTotal} lessons` : "Browse modules"}
              {props.progressPercent != null
                ? ` · ${formatPercent(props.progressPercent)} complete`
                : ""}
            </span>
          </span>
          <span className="shrink-0 font-mono text-label-sm text-primary uppercase">Open</span>
        </button>
      </DialogTrigger>
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="border-b border-primary/10 px-6 pt-6 pb-4 text-left">
          <DialogTitle>Curriculum</DialogTitle>
          <DialogDescription>
            Jump to any lesson in this course.
            {props.progressPercent != null
              ? ` You're ${formatPercent(props.progressPercent)} of the way through.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-thin max-h-[60vh] overflow-y-auto">
          <CurriculumContent
            {...props}
            onNavigate={() => {
              setOpen(false);
              props.onNavigate?.();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Bookmark, CheckCircle2, ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Lesson } from "@/types";

interface LessonTopbarProps {
  courseId: string;
  /** Undefined while the lesson query is in flight or errored. */
  lesson: Lesson | undefined;
  lessonLoading: boolean;
  courseTitle: string | undefined;
  courseTitleLoading: boolean;
  courseTitleError: boolean;
  onToggleComplete: () => void;
  completePending: boolean;
  onToggleBookmark: () => void;
  bookmarkPending: boolean;
  onNavigateLesson: (lessonId: number) => void;
}

/**
 * Immersive player chrome — white bar, back-to-course, lesson identity and
 * the complete/bookmark/prev/next controls.
 */
export function LessonTopbar({
  courseId,
  lesson,
  lessonLoading,
  courseTitle,
  courseTitleLoading,
  courseTitleError,
  onToggleComplete,
  completePending,
  onToggleBookmark,
  bookmarkPending,
  onNavigateLesson,
}: LessonTopbarProps) {
  const isCompleted = lesson?.is_completed ?? false;
  const isBookmarked = lesson?.is_bookmarked ?? false;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link to={paths.course(courseId)} aria-label="Back to course">
            <ChevronLeft aria-hidden="true" />
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          {courseTitleLoading ? (
            <Skeleton className="mb-1 h-3 w-40 max-w-full" />
          ) : (
            <p
              className={cn(
                "truncate font-mono text-label-sm uppercase",
                courseTitleError ? "text-error" : "text-primary",
              )}
            >
              {courseTitleError ? "Course unavailable" : (courseTitle ?? "Course")}
            </p>
          )}
          {lessonLoading ? (
            <Skeleton className="mt-1 h-4 w-56 max-w-full" />
          ) : (
            <h1 className="truncate font-display text-body-md font-semibold text-on-surface">
              {lesson?.title ?? "Lesson"}
            </h1>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={onToggleBookmark}
            disabled={!lesson || bookmarkPending}
            aria-pressed={isBookmarked}
            aria-label={isBookmarked ? "Remove lesson bookmark" : "Bookmark this lesson"}
            title={isBookmarked ? "Remove bookmark" : "Bookmark lesson"}
          >
            <Bookmark
              aria-hidden="true"
              className={cn(
                "transition-colors",
                isBookmarked ? "fill-primary text-primary" : "text-on-surface-variant",
              )}
            />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleComplete}
            disabled={!lesson || completePending}
            aria-pressed={isCompleted}
            className={cn(
              isCompleted &&
                "border-success bg-success-container text-on-success-container hover:bg-success-container/70",
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="text-success" aria-hidden="true" />
            ) : (
              <CircleCheck aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isCompleted ? "Completed" : "Mark complete"}</span>
            <span className="sr-only sm:hidden">
              {isCompleted ? "Completed — select to mark incomplete" : "Mark complete"}
            </span>
          </Button>

          <Separator
            orientation="vertical"
            className="mx-1 hidden data-[orientation=vertical]:h-6 sm:block"
          />

          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            disabled={lesson?.previous_lesson_id == null}
            onClick={() => {
              if (lesson?.previous_lesson_id != null) onNavigateLesson(lesson.previous_lesson_id);
            }}
            aria-label="Previous lesson"
            title="Previous lesson"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            disabled={lesson?.next_lesson_id == null}
            onClick={() => {
              if (lesson?.next_lesson_id != null) onNavigateLesson(lesson.next_lesson_id);
            }}
            aria-label="Next lesson"
            title="Next lesson"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}

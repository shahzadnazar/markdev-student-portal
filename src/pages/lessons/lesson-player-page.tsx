import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompleteLesson, useCourse, useCourseModules, useLesson } from "@/hooks/use-catalog";
import { useToggleBookmark } from "@/hooks/use-engagement";
import { CommentsSection } from "./comments-section";
import { LessonContent, LessonMetaCard, ResourcesCard } from "./lesson-content";
import { CurriculumDialog, CurriculumRail } from "./lesson-sidebar";
import { LessonTopbar } from "./lesson-topbar";
import { paths } from "@/routes/paths";

const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
} as const;

function LessonSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

/**
 * Immersive lesson player — rendered outside the app shell. Own top bar,
 * content column and a sticky curriculum rail on xl screens.
 */
export default function LessonPlayerPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const courseId = params.courseId ?? "";
  const lessonId = params.lessonId ?? "";
  const navigate = useNavigate();

  const lessonQuery = useLesson(courseId, lessonId);
  const courseQuery = useCourse(courseId);
  const modulesQuery = useCourseModules(courseId);
  const completeLesson = useCompleteLesson(courseId);
  const toggleBookmark = useToggleBookmark();

  const lesson = lessonQuery.data;

  // Land at the top of the new lesson when navigating prev/next or via the rail.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [lessonId]);

  const handleToggleComplete = () => {
    if (!lesson) return;
    const next = !lesson.is_completed;
    completeLesson.mutate(
      { lessonId: lesson.id, completed: next },
      {
        onSuccess: () => {
          toast.success(
            next ? "Lesson marked as complete. Nice work!" : "Lesson marked as not complete.",
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Couldn't update your progress. Please try again.",
          );
        },
      },
    );
  };

  const handleToggleBookmark = () => {
    if (!lesson) return;
    const next = !lesson.is_bookmarked;
    toggleBookmark.mutate(
      { type: "lesson", id: lesson.id, bookmarked: next },
      {
        onSuccess: () => {
          toast.success(next ? "Lesson saved to your bookmarks." : "Bookmark removed.");
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Couldn't update the bookmark. Please try again.",
          );
        },
      },
    );
  };

  const curriculumProps = {
    courseId,
    currentLessonId: Number(lessonId),
    modules: modulesQuery.data,
    isPending: modulesQuery.isPending,
    isError: modulesQuery.isError,
    error: modulesQuery.error,
    onRetry: () => {
      void modulesQuery.refetch();
    },
    progressPercent: courseQuery.data?.enrollment?.progress_percent,
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-ice">
      <LessonTopbar
        courseId={courseId}
        lesson={lesson}
        lessonLoading={lessonQuery.isPending}
        courseTitle={courseQuery.data?.title}
        courseTitleLoading={courseQuery.isPending}
        courseTitleError={courseQuery.isError}
        onToggleComplete={handleToggleComplete}
        completePending={completeLesson.isPending}
        onToggleBookmark={handleToggleBookmark}
        bookmarkPending={toggleBookmark.isPending}
        onNavigateLesson={(id) => {
          void navigate(paths.lesson(courseId, id));
        }}
      />

      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* No items-start: the rail column must stretch to row height so its sticky card can travel. */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="min-w-0 space-y-6">
            {/* Below xl the curriculum rail collapses into a dialog disclosure. */}
            <motion.div
              {...sectionMotion}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="xl:hidden"
            >
              <CurriculumDialog {...curriculumProps} />
            </motion.div>

            {lessonQuery.isPending ? (
              <LessonSkeleton />
            ) : lessonQuery.isError ? (
              <ErrorState
                error={lessonQuery.error}
                title="Lesson failed to load"
                onRetry={() => {
                  void lessonQuery.refetch();
                }}
              />
            ) : lesson ? (
              <>
                <motion.div {...sectionMotion} transition={{ duration: 0.4, ease: "easeOut" }}>
                  <LessonContent lesson={lesson} />
                </motion.div>

                <motion.div
                  {...sectionMotion}
                  transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
                >
                  <LessonMetaCard lesson={lesson} />
                </motion.div>

                {lesson.resources.length > 0 ? (
                  <motion.div
                    {...sectionMotion}
                    transition={{ duration: 0.4, delay: 0.14, ease: "easeOut" }}
                  >
                    <ResourcesCard resources={lesson.resources} />
                  </motion.div>
                ) : null}
              </>
            ) : null}

            <motion.div
              {...sectionMotion}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            >
              <CommentsSection lessonId={lessonId} />
            </motion.div>
          </div>

          <CurriculumRail {...curriculumProps} />
        </div>
      </main>
    </div>
  );
}

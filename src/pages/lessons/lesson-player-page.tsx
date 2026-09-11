import { useEffect } from "react";
import { motion } from "framer-motion";
import { Paperclip, PlayCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCompleteLesson,
  useCourse,
  useCourseModules,
  useLesson,
} from "@/hooks/use-catalog";
import {
  useToggleBookmark,
  useTrackLessonActivity,
} from "@/hooks/use-engagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentsSection } from "./comments-section";
import { LessonContent, LessonMetaCard, ResourcesCard } from "./lesson-content";
import { CurriculumDialog, CurriculumRail } from "./lesson-sidebar";
import { LessonTopbar } from "./lesson-topbar";
import { useVideoProgress } from "@/hooks/use-video-progress";
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
  const trackLessonActivity = useTrackLessonActivity();

  const lesson = lessonQuery.data;

  const isVideoLesson = lesson?.type === "video" && Boolean(lesson?.video);

  const {
    progress: watch,
    onSample,
    onPause,
  } = useVideoProgress({
    courseId,
    lessonId,
    initial: lesson?.video_progress ?? null,
    enabled: isVideoLesson,
  });

  // A video lesson only counts once enough of it has genuinely been played;
  // seeking past a section never contributes, so the scrubber can't fake it.
  const completeBlockedReason =
    isVideoLesson && !lesson?.is_completed && watch && !watch.can_complete
      ? `Watch at least ${watch.required_percent}% of the video to complete this lesson — you're at ${watch.coverage_percent}%.`
      : null;

  // Land at the top of the new lesson when navigating prev/next or via the rail.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [lessonId]);

  // Track lesson activity when the lesson loads.
  useEffect(() => {
    if (!lesson) return;

    trackLessonActivity.mutate({
      courseId,
      lessonId,
      minutes: Math.max(1, Math.round(lesson.duration_minutes)),
    });
  }, [lesson?.id, courseId, lessonId]);

  const handleToggleComplete = () => {
    if (!lesson) return;
    const next = !lesson.is_completed;
    completeLesson.mutate(
      { lessonId: lesson.id, completed: next },
      {
        onSuccess: () => {
          toast.success(
            next
              ? "Lesson marked as complete. Nice work!"
              : "Lesson marked as not complete.",
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
          toast.success(
            next ? "Lesson saved to your bookmarks." : "Bookmark removed.",
          );
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
        completeBlockedReason={completeBlockedReason}
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
              <motion.div
                {...sectionMotion}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Two tabs, Premium Video first. Called tabs rather than
                    modules because a course already HAS modules — Module 01,
                    Module 02 — and reusing that word for a different idea in
                    the same screen is how a codebase starts lying to itself.

                    The player, the lesson meta and the discussion live
                    together under the first tab because they are one activity:
                    you watch, then you ask. Resources are a different errand
                    and get their own tab rather than a scroll. */}
                <Tabs defaultValue="video" className="gap-4">
                  <TabsList>
                    <TabsTrigger value="video">
                      <PlayCircle aria-hidden="true" />
                      Premium Video
                    </TabsTrigger>
                    <TabsTrigger value="resources">
                      <Paperclip aria-hidden="true" />
                      Resources
                      {lesson.resources.length > 0 ? (
                        <span className="rounded-full bg-surface-container px-1.5 font-mono text-label-sm">
                          {lesson.resources.length}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="video" className="space-y-5">
                    <LessonContent lesson={lesson} onSample={onSample} onPause={onPause} />
                    <LessonMetaCard lesson={lesson} />
                    <CommentsSection lessonId={lessonId} />
                  </TabsContent>

                  <TabsContent value="resources">
                    <ResourcesCard resources={lesson.resources} />
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : null}
          </div>

          <CurriculumRail {...curriculumProps} />
        </div>
      </main>
    </div>
  );
}

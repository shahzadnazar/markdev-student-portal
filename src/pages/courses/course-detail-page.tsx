import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Clock,
  GraduationCap,
  Layers,
  Play,
  Star,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useCourse, useCourseModules, useEnroll } from "@/hooks/use-catalog";
import { useToggleBookmark } from "@/hooks/use-engagement";
import { formatCompact, formatDuration, formatPercent, initials } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { Course, CourseLevel, LessonSummary } from "@/types";
import { CurriculumAccordion } from "./curriculum-accordion";

const levelLabels: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** Rich-text wrapper classes for API-provided HTML (see design notes). */
const richTextClassName =
  "space-y-4 text-body-md text-on-surface [&_a]:text-primary [&_a]:underline [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-xl [&_pre]:bg-inverse-surface [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-body-sm [&_pre]:text-inverse-on-surface [&_pre]:overflow-x-auto [&_code]:font-mono";

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

export default function CourseDetailPage() {
  const { courseId = "" } = useParams();

  const courseQuery = useCourse(courseId);
  const modulesQuery = useCourseModules(courseId);
  const enroll = useEnroll(courseId);
  const toggleBookmark = useToggleBookmark();

  /** First incomplete lesson in curriculum order; falls back to the very first lesson. */
  const continueLesson = useMemo<LessonSummary | null>(() => {
    const modules = modulesQuery.data;
    if (!modules || modules.length === 0) return null;
    const lessons = [...modules]
      .sort((a, b) => a.position - b.position)
      .flatMap((module) => [...module.lessons].sort((a, b) => a.position - b.position));
    if (lessons.length === 0) return null;
    return lessons.find((lesson) => !lesson.is_completed) ?? lessons[0] ?? null;
  }, [modulesQuery.data]);

  if (courseQuery.isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (courseQuery.isError) {
    return (
      <div>
        <PageHeader eyebrow="Catalog" title="Course" />
        <ErrorState
          title="Couldn't load this course"
          error={courseQuery.error}
          onRetry={() => {
            void courseQuery.refetch();
          }}
        />
      </div>
    );
  }

  const course = courseQuery.data;
  if (!course) return null;

  const handleEnroll = () => {
    enroll.mutate(undefined, {
      onSuccess: () => {
        toast.success("You're enrolled. Your first lesson is ready when you are.");
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "We couldn't enroll you right now. Please try again.",
        );
      },
    });
  };

  const handleToggleBookmark = () => {
    const bookmarked = !course.is_bookmarked;
    toggleBookmark.mutate(
      { type: "course", id: course.id, bookmarked },
      {
        onSuccess: () => {
          toast.success(
            bookmarked ? "Course saved to your bookmarks." : "Course removed from your bookmarks.",
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "We couldn't update your bookmark. Please try again.",
          );
        },
      },
    );
  };

  return (
    <div>
      <PageHeader eyebrow="Catalog" title={course.title} />

      <div className="space-y-6">
        {/* Hero */}
        <motion.div {...sectionMotion(0.05)}>
          <Card>
            <CardContent>
              <div className="grid gap-8 lg:grid-cols-5">
                {/* Left: badges, excerpt, meta, instructor strip */}
                <div className="min-w-0 lg:col-span-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {course.category ? (
                      <Badge variant="primary">{course.category.name}</Badge>
                    ) : null}
                    <Badge variant="neutral">{levelLabels[course.level]}</Badge>
                    {course.is_free ? <Badge variant="success">Free</Badge> : null}
                  </div>

                  {course.excerpt ? (
                    <p className="mt-4 text-body-lg text-on-surface-variant">{course.excerpt}</p>
                  ) : null}

                  <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Duration</dt>
                      <Clock className="size-3.5" aria-hidden="true" />
                      <dd>{formatDuration(course.duration_minutes)}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Lessons</dt>
                      <BookOpen className="size-3.5" aria-hidden="true" />
                      <dd>{course.lessons_count} lessons</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Students</dt>
                      <Users className="size-3.5" aria-hidden="true" />
                      <dd>{formatCompact(course.students_count)} students</dd>
                    </div>
                    {course.rating != null ? (
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">Rating</dt>
                        <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                        <dd>{course.rating.toFixed(1)}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {course.instructor ? (
                    <div className="mt-8 flex items-center gap-3 border-t border-outline-variant/40 pt-6">
                      <Avatar>
                        {course.instructor.avatar_url ? (
                          <AvatarImage
                            src={course.instructor.avatar_url}
                            alt={`${course.instructor.name}'s avatar`}
                          />
                        ) : null}
                        <AvatarFallback>{initials(course.instructor.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-medium text-on-surface">
                          {course.instructor.name}
                        </p>
                        {course.instructor.headline ? (
                          <p className="truncate text-body-sm text-on-surface-variant">
                            {course.instructor.headline}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right: thumbnail + actions */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-brand relative aspect-video w-full overflow-hidden rounded-2xl">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={`${course.title} course thumbnail`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <BookOpen className="size-12 text-white/70" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    {course.is_enrolled && course.enrollment ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between font-mono text-label-sm text-on-surface-variant">
                          <span className="uppercase">Progress</span>
                          <span>{formatPercent(course.enrollment.progress_percent)}</span>
                        </div>
                        <Progress
                          value={course.enrollment.progress_percent}
                          aria-label="Course progress"
                        />
                      </div>
                    ) : null}

                    <div className="flex items-center gap-3">
                      {course.is_enrolled ? (
                        continueLesson ? (
                          <Button asChild size="lg" className="flex-1">
                            <Link to={paths.lesson(course.id, continueLesson.id)}>
                              <Play aria-hidden="true" />
                              Continue learning
                            </Link>
                          </Button>
                        ) : (
                          <Button size="lg" className="flex-1" disabled>
                            <Play aria-hidden="true" />
                            Continue learning
                          </Button>
                        )
                      ) : (
                        <Button
                          size="lg"
                          className="flex-1"
                          onClick={handleEnroll}
                          disabled={enroll.isPending}
                        >
                          {enroll.isPending ? (
                            <>
                              <Spinner className="text-on-primary" aria-hidden="true" />
                              Enrolling…
                            </>
                          ) : (
                            <>
                              <GraduationCap aria-hidden="true" />
                              Enroll now
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-11 shrink-0"
                        onClick={handleToggleBookmark}
                        disabled={toggleBookmark.isPending}
                        aria-pressed={course.is_bookmarked}
                        aria-label={
                          course.is_bookmarked
                            ? "Remove this course from bookmarks"
                            : "Bookmark this course"
                        }
                      >
                        {course.is_bookmarked ? (
                          <BookmarkCheck aria-hidden="true" />
                        ) : (
                          <Bookmark aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* About */}
        <motion.div {...sectionMotion(0.1)}>
          <Card>
            <CardHeader>
              <p className="font-mono text-label-sm text-primary uppercase">Overview</p>
              <CardTitle>About this course</CardTitle>
            </CardHeader>
            <CardContent>
              {course.description ? (
                <div
                  className={richTextClassName}
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              ) : (
                <p className="text-body-md text-on-surface-variant">
                  {course.excerpt ??
                    "The instructor hasn't published a detailed description for this course yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Curriculum */}
        <motion.div {...sectionMotion(0.15)}>
          <Card>
            <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-label-sm text-primary uppercase">Curriculum</p>
                <CardTitle className="mt-1.5">Course content</CardTitle>
              </div>
              <p className="font-mono text-label-sm text-on-surface-variant">
                {course.modules_count} modules · {course.lessons_count} lessons ·{" "}
                {formatDuration(course.duration_minutes)}
              </p>
            </CardHeader>
            <CardContent>
              {modulesQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : modulesQuery.isError ? (
                <ErrorState
                  title="Couldn't load the curriculum"
                  error={modulesQuery.error}
                  onRetry={() => {
                    void modulesQuery.refetch();
                  }}
                  className="py-10"
                />
              ) : !modulesQuery.data || modulesQuery.data.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title="Curriculum coming soon"
                  description="The instructor is still assembling the modules for this course. Check back shortly."
                  className="py-10"
                />
              ) : (
                <CurriculumAccordion
                  modules={modulesQuery.data}
                  courseId={course.id}
                  isEnrolled={course.is_enrolled}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructor */}
        {course.instructor ? (
          <motion.div {...sectionMotion(0.2)}>
            <InstructorCard instructor={course.instructor} />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function InstructorCard({ instructor }: { instructor: NonNullable<Course["instructor"]> }) {
  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Instructor</p>
        <CardTitle>Meet your instructor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-16 text-body-lg">
            {instructor.avatar_url ? (
              <AvatarImage src={instructor.avatar_url} alt={`${instructor.name}'s avatar`} />
            ) : null}
            <AvatarFallback>{initials(instructor.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-body-lg font-semibold text-on-surface">
              {instructor.name}
            </h3>
            {instructor.headline ? (
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{instructor.headline}</p>
            ) : null}
            {instructor.bio ? (
              <p className="mt-3 text-body-md text-on-surface-variant">{instructor.bio}</p>
            ) : null}
            {(instructor.courses_count != null || instructor.students_count != null) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-label-sm text-on-surface-variant">
                {instructor.courses_count != null ? (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-3.5" aria-hidden="true" />
                    {instructor.courses_count}{" "}
                    {instructor.courses_count === 1 ? "course" : "courses"}
                  </span>
                ) : null}
                {instructor.students_count != null ? (
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" aria-hidden="true" />
                    {formatCompact(instructor.students_count)} students
                  </span>
                ) : null}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Loading layout that mirrors the final page structure. */
function CourseDetailSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-10 w-2/3 max-w-xl" />
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-3 pt-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              </div>
              <div className="space-y-4 lg:col-span-2">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-52" />
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

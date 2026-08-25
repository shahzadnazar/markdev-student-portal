import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  //Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileQuestion,
  GraduationCap,
  Play,
  Search,
  // Settings,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { useCourses, useCourseModules } from "@/hooks/use-catalog";
import {
  formatCompact,
  formatDuration,
  formatPercent,
  initials,
} from "@/lib/format";
import { paths } from "@/routes/paths";
import type { LessonSummary } from "@/types";

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.35,
    delay,
    ease: "easeOut" as const,
  },
});

export default function CoursesPage() {
  const coursesQuery = useCourses({
    page: 1,
    per_page: 1,
  });

  const course = coursesQuery.data?.data?.[0];

  const modulesQuery = useCourseModules(course?.id ?? "");

  const lessons = useMemo<LessonSummary[]>(() => {
    if (!modulesQuery.data) return [];

    return [...modulesQuery.data]
      .sort((a, b) => a.position - b.position)
      .flatMap((module) =>
        [...module.lessons].sort((a, b) => a.position - b.position),
      );
  }, [modulesQuery.data]);

  const completedLessons = lessons.filter(
    (lesson) => lesson.is_completed,
  ).length;

  const continueLesson =
    lessons.find((lesson) => !lesson.is_completed) ?? lessons[0];

  if (coursesQuery.isLoading) {
    return <CoursesDashboardSkeleton />;
  }

  if (coursesQuery.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="p-8 text-center">
            <GraduationCap className="mx-auto size-10 text-primary" />

            <h1 className="mt-4 font-display text-headline-md font-semibold text-on-surface">
              Couldn't load your course
            </h1>

            <p className="mt-2 text-body-sm text-on-surface-variant">
              Something went wrong while loading your course.
            </p>

            <Button
              className="mt-6"
              onClick={() => void coursesQuery.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="p-8 text-center">
            <GraduationCap className="mx-auto size-10 text-primary" />

            <h1 className="mt-4 font-display text-headline-md font-semibold text-on-surface">
              No course assigned
            </h1>

            <p className="mt-2 text-body-sm text-on-surface-variant">
              You don't have a course assigned to your account yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = course.enrollment?.progress_percent ?? 0;
  const totalLessons = lessons.length || course.lessons_count;

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-30 -mx-4 mb-6 flex h-16 items-center justify-between border-b border-outline-variant/20 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="min-w-0 px-6">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-primary sm:text-label-sm">
            My Course
          </p>

          <h2 className="truncate font-display text-base font-semibold text-on-surface sm:text-lg">
            {course.title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4 px-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />

            <Input
              placeholder="Search resources..."
              className="h-9 w-44 rounded-full border-0 bg-surface-ice pl-9 lg:w-56"
            />
          </div>

          {/* <button
            type="button"
            aria-label="Notifications"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-ice hover:text-primary"
          >
            <Bell className="size-5" />
          </button>

          <button
            type="button"
            aria-label="Settings"
            className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-ice hover:text-primary sm:block"
          >
            <Settings className="size-5" />
          </button>

          <Avatar className="size-8 sm:size-9">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              ST
            </AvatarFallback>
          </Avatar> */}
        </div>
      </header>

      <main className="w-full">
        <div className="mx-auto w-full min-w-0 max-w-375 space-y-5 sm:space-y-6">
          {/* HERO */}
          <motion.section {...sectionMotion(0.05)}>
            <div className="relative overflow-hidden rounded-2xl bg-primary shadow-xl shadow-primary/10 sm:rounded-3xl">
              <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/5 blur-3xl sm:size-96" />
              <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-white/5 blur-3xl" />

              <div className="relative grid gap-8 p-6 sm:p-8 md:p-10 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white sm:text-label-sm">
                      {course.is_enrolled
                        ? "Active Course"
                        : "Available Course"}
                    </span>

                    <span className="font-mono text-[11px] text-white/70 sm:text-label-sm">
                      {course.duration_label ??
                        formatDuration(course.duration_minutes)}
                    </span>

                    <span className="font-mono text-[11px] capitalize text-white/70 sm:text-label-sm">
                      {course.level}
                    </span>
                  </div>

                  <h1 className="mt-5 max-w-2xl wrap-break-words font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {course.title}
                  </h1>

                  {course.excerpt ? (
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
                      {course.excerpt}
                    </p>
                  ) : (
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
                      Continue your learning journey and complete the course
                      curriculum.
                    </p>
                  )}

                  <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 sm:mt-8 sm:grid-cols-4 sm:gap-6">
                    <HeroStat
                      label="Progress"
                      value={formatPercent(progress)}
                    />

                    <HeroStat
                      label="Lessons"
                      value={String(course.lessons_count)}
                    />

                    <HeroStat
                      label="Students"
                      value={formatCompact(course.students_count)}
                    />

                    <HeroStat
                      label="Modules"
                      value={String(course.modules_count)}
                    />
                  </div>

                  <div className="mt-7 sm:mt-8">
                    {course.is_enrolled && continueLesson ? (
                      <Button
                        asChild
                        size="lg"
                        className="w-full bg-white text-primary shadow-lg hover:bg-white/90 sm:w-auto"
                      >
                        <Link to={paths.lesson(course.id, continueLesson.id)}>
                          <Play />
                          Continue Learning
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="lg"
                        className="w-full bg-white text-primary shadow-lg hover:bg-white/90 sm:w-auto"
                      >
                        <Link to={paths.course(course.id)}>
                          <BookOpen />
                          View Course
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center lg:justify-end">
                  <ProgressCircle
                    value={progress}
                    completed={completedLessons}
                    total={totalLessons}
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* CONTENT GRID */}
          <div className="grid w-full min-w-0 grid-cols-1 gap-5 overflow-hidden sm:gap-6 xl:grid-cols-12">
            {/* INSTRUCTOR */}
            <motion.section {...sectionMotion(0.1)} className="xl:col-span-4">
              <Card className="h-full rounded-2xl border-0 shadow-sm sm:rounded-3xl">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-primary sm:text-label-sm">
                        Instructor
                      </p>

                      <h2 className="mt-1 font-display text-xl font-semibold text-on-surface sm:text-2xl">
                        Your Instructor
                      </h2>
                    </div>

                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                      <GraduationCap className="size-5" />
                    </div>
                  </div>

                  {course.instructor ? (
                    <>
                      <div className="flex items-center gap-4">
                        <Avatar className="size-14 shrink-0 rounded-2xl sm:size-16">
                          {course.instructor.avatar_url ? (
                            <AvatarImage
                              src={course.instructor.avatar_url}
                              alt={course.instructor.name}
                            />
                          ) : null}

                          <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
                            {initials(course.instructor.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <h3 className="truncate font-display text-base font-semibold text-on-surface sm:text-lg">
                            {course.instructor.name}
                          </h3>

                          {course.instructor.headline ? (
                            <p className="mt-1 line-clamp-2 font-mono text-[10px] text-primary sm:text-label-sm">
                              {course.instructor.headline}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {course.instructor.bio ? (
                        <p className="mt-5 line-clamp-4 text-sm leading-6 text-on-surface-variant">
                          {course.instructor.bio}
                        </p>
                      ) : null}

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-surface-ice p-4">
                          <p className="font-mono text-[10px] uppercase text-on-surface-variant">
                            Courses
                          </p>

                          <p className="mt-1 font-display text-2xl font-semibold text-on-surface">
                            {course.instructor.courses_count ?? 0}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-surface-ice p-4">
                          <p className="font-mono text-[10px] uppercase text-on-surface-variant">
                            Students
                          </p>

                          <p className="mt-1 font-display text-2xl font-semibold text-on-surface">
                            {formatCompact(
                              course.instructor.students_count ?? 0,
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      Instructor information is not available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.section>

            {/* WEEKLY SCHEDULE */}
            <motion.section
              {...sectionMotion(0.15)}
              className="min-w-0 xl:col-span-8"
            >
              <Card className="rounded-2xl border-0 shadow-sm sm:rounded-3xl">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-primary sm:text-label-sm">
                        Learning Plan
                      </p>

                      <h2 className="mt-1 font-display text-xl font-semibold text-on-surface sm:text-2xl">
                        Weekly Schedule
                      </h2>
                    </div>

                    <div className="hidden gap-2 sm:flex">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-full"
                      >
                        <ChevronLeft />
                      </Button>

                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-full"
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:gap-3">
                    {weekDays().map((day, index) => (
                      <div
                        key={day.key}
                        className={[
                          "min-w-[68px] flex-1 rounded-xl p-3 text-center sm:min-w-[78px] sm:rounded-2xl sm:p-4",
                          index === 0
                            ? "bg-secondary text-on-secondary shadow-lg"
                            : "bg-surface-ice text-on-surface-variant",
                        ].join(" ")}
                      >
                        <p className="font-mono text-[9px] font-medium sm:text-label-sm">
                          {day.weekday}
                        </p>

                        <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">
                          {day.day}
                        </p>

                        <p className="mt-1 font-mono text-[9px] sm:text-label-sm">
                          {day.month}
                        </p>

                        {index === 0 ? (
                          <div className="mx-auto mt-2 size-1.5 rounded-full bg-white" />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {lessons.slice(0, 3).map((lesson) => (
                      <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        courseId={course.id}
                        isEnrolled={course.is_enrolled}
                      />
                    ))}

                    {lessons.length === 0 ? (
                      <div className="rounded-2xl bg-surface-ice p-6 text-center text-sm text-on-surface-variant">
                        No lessons available yet.
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* NEXT LESSON */}
            <motion.section
              {...sectionMotion(0.2)}
              className="min-w-0 md:col-span-1 xl:col-span-4"
            >
              <Card className="h-full rounded-2xl border-0 shadow-sm sm:rounded-3xl">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant sm:text-label-sm">
                      Next Lesson
                    </p>

                    <div className="rounded-xl bg-secondary/10 p-2 text-secondary">
                      <CalendarDays className="size-5" />
                    </div>
                  </div>

                  <h3 className="mt-5 line-clamp-2 font-display text-xl font-semibold text-on-surface sm:text-2xl">
                    {continueLesson?.title ?? "All lessons completed"}
                  </h3>

                  {continueLesson ? (
                    <>
                      <div className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
                        <Clock className="size-4 shrink-0" />

                        {formatDuration(continueLesson.duration_minutes)}
                      </div>

                      <Button
                        asChild
                        variant="secondary"
                        className="mt-6 w-full"
                      >
                        <Link to={paths.lesson(course.id, continueLesson.id)}>
                          <Play />
                          Start Lesson
                        </Link>
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </motion.section>

            {/* PROGRESS */}
            <motion.section
              {...sectionMotion(0.25)}
              className="min-w-0 md:col-span-1 xl:col-span-4"
            >
              <Card className="h-full rounded-2xl border-0 shadow-sm sm:rounded-3xl">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant sm:text-label-sm">
                      Course Progress
                    </p>

                    <div className="rounded-xl bg-success/10 p-2 text-success">
                      <CheckCircle2 className="size-5" />
                    </div>
                  </div>

                  <p className="mt-5 font-display text-4xl font-semibold text-on-surface">
                    {formatPercent(progress)}
                  </p>

                  <Progress className="mt-4" value={progress} />

                  <p className="mt-3 text-sm text-on-surface-variant">
                    {completedLessons} of {totalLessons} lessons completed
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {/* STATISTICS */}
            <motion.section
              {...sectionMotion(0.3)}
              className="min-w-0 md:col-span-1 xl:col-span-4"
            >
              <Card className="h-full rounded-2xl border-0 shadow-sm sm:rounded-3xl">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant sm:text-label-sm">
                      Course Statistics
                    </p>

                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Users className="size-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <CourseStat
                      value={String(course.modules_count)}
                      label="Modules"
                    />

                    <CourseStat
                      value={String(course.lessons_count)}
                      label="Lessons"
                    />

                    <CourseStat
                      value={formatCompact(course.students_count)}
                      label="Students"
                    />

                    <CourseStat
                      value={course.rating?.toFixed(1) ?? "—"}
                      label="Rating"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </div>

          {/* TEST & ASSIGNMENT TABS */}
          <motion.section {...sectionMotion(0.35)} className="w-full min-w-0">
            <div className="grid w-full min-w-0 grid-cols-1 gap-5 overflow-hidden sm:grid-cols-2">
              {/* NEXT TEST */}
              <Link to={paths.quizzes} className="group min-w-0">
                <Card className="h-full rounded-2xl border-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-primary sm:text-label-sm">
                          Next Test
                        </p>

                        <h2 className="mt-2 font-display text-xl font-semibold text-on-surface sm:text-2xl">
                          Test
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                          Check your knowledge and complete your next test.
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <FileQuestion className="size-5" />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-mono text-xs text-on-surface-variant">
                        Continue assessment
                      </span>

                      <ChevronRight className="size-5 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* ASSIGNMENT */}
              <Link to={paths.assignments} className="group min-w-0">
                <Card className="h-full rounded-2xl border-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-secondary sm:text-label-sm">
                          Assignment
                        </p>

                        <h2 className="mt-2 font-display text-xl font-semibold text-on-surface sm:text-2xl">
                          Assignment
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                          View and complete your assigned coursework.
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl bg-secondary/10 p-3 text-secondary transition-colors group-hover:bg-secondary group-hover:text-white">
                        <ClipboardList className="size-5" />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-mono text-xs text-on-surface-variant">
                        View assignment
                      </span>

                      <ChevronRight className="size-5 text-secondary transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small Components                                                           */
/* -------------------------------------------------------------------------- */

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-wider text-white/55 sm:text-label-sm">
        {label}
      </p>

      <p className="mt-1 truncate font-display text-xl font-semibold text-white sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function CourseStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-on-surface">
        {value}
      </p>

      <p className="mt-0.5 text-sm text-on-surface-variant">{label}</p>
    </div>
  );
}

function ProgressCircle({
  value,
  completed,
  total,
}: {
  value: number;
  completed: number;
  total: number;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (circumference * safeValue) / 100;

  return (
    <div className="flex w-full max-w-[260px] flex-col items-center rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-7">
      <div className="relative size-36 sm:size-40">
        <svg className="-rotate-90" viewBox="0 0 128 128" aria-hidden="true">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="8"
          />

          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl font-bold text-white sm:text-4xl">
            {Math.round(safeValue)}%
          </span>
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] font-medium uppercase tracking-wider text-white/80 sm:text-label-sm">
        Course Progress
      </p>

      <p className="mt-1 text-xs text-white/50 sm:text-sm">
        {completed} of {total} lessons
      </p>
    </div>
  );
}

function LessonItem({
  lesson,
  courseId,
  isEnrolled,
}: {
  lesson: LessonSummary;
  courseId: number | string;
  isEnrolled: boolean;
}) {
  const locked = !isEnrolled && !lesson.is_preview;

  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-11">
        {lesson.is_completed ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : (
          <Play className="size-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs font-medium text-on-surface sm:text-label-md">
          {lesson.title}
        </p>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-on-surface-variant sm:text-sm">
          <span>{lessonTypeLabel(lesson.type)}</span>
          <span>·</span>
          <span>{formatDuration(lesson.duration_minutes)}</span>
        </p>
      </div>

      {lesson.is_completed ? (
        <CheckCircle2 className="size-5 shrink-0 text-success" />
      ) : locked ? (
        <span className="shrink-0 font-mono text-[9px] uppercase text-outline sm:text-label-sm">
          Locked
        </span>
      ) : (
        <Play className="size-4 shrink-0 text-outline sm:size-5" />
      )}
    </>
  );

  if (locked) {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-ice p-3 opacity-60 sm:gap-4 sm:p-4">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={paths.lesson(courseId, lesson.id)}
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-ice p-3 transition-all hover:border-primary/20 hover:bg-white hover:shadow-sm sm:gap-4 sm:p-4"
    >
      {content}
    </Link>
  );
}

function lessonTypeLabel(type: string) {
  switch (type) {
    case "video":
      return "Video";
    case "article":
      return "Article";
    case "quiz":
      return "Quiz";
    case "assignment":
      return "Assignment";
    case "resource":
      return "Resource";
    default:
      return "Lesson";
  }
}

function weekDays() {
  const now = new Date();

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(now);

    date.setDate(now.getDate() - now.getDay() + 1 + index);

    return {
      key: date.toISOString(),
      weekday: date
        .toLocaleDateString("en-US", {
          weekday: "short",
        })
        .toUpperCase(),
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", {
        month: "short",
      }),
    };
  });
}

function CoursesDashboardSkeleton() {
  return (
    <div className="w-full min-w-0">
      <div className="sticky top-0 z-30 -mx-4 mb-6 h-16 border-b border-outline-variant/20 bg-white shadow-sm sm:-mx-6 lg:-mx-8" />

      <div className="w-full space-y-5 sm:space-y-6">
        <Skeleton className="h-[520px] w-full rounded-2xl sm:h-[430px] sm:rounded-3xl" />

        <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-12">
          <Skeleton className="h-80 rounded-2xl sm:rounded-3xl xl:col-span-4" />

          <Skeleton className="h-80 rounded-2xl sm:rounded-3xl xl:col-span-8" />

          <Skeleton className="h-52 rounded-2xl sm:rounded-3xl xl:col-span-4" />

          <Skeleton className="h-52 rounded-2xl sm:rounded-3xl xl:col-span-4" />

          <Skeleton className="h-52 rounded-2xl sm:rounded-3xl xl:col-span-4" />
        </div>
      </div>
    </div>
  );
}

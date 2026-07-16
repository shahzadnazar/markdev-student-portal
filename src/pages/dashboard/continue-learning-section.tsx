import { ArrowRight, BookOpen, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPercent, formatRelative } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { CourseProgress } from "@/types";

function CourseProgressItem({ item }: { item: CourseProgress }) {
  const { course } = item;

  return (
    <Card className="flex flex-col gap-4 p-5 transition-shadow duration-200 hover:shadow-elevated sm:flex-row sm:items-center sm:gap-5">
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt=""
          aria-hidden="true"
          className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-40"
        />
      ) : (
        <div
          className="flex h-36 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-brand sm:h-24 sm:w-40"
          aria-hidden="true"
        >
          <BookOpen className="size-8 text-white/90" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-body-lg font-semibold text-on-surface">
          {course.title}
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={item.progress_percent}
            className="flex-1"
            aria-label={`${course.title} progress`}
          />
          <span className="shrink-0 font-mono text-label-sm text-on-surface">
            {formatPercent(item.progress_percent)}
          </span>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-label-sm text-on-surface-variant">
          <span>
            {item.completed_lessons}/{item.total_lessons} lessons
          </span>
          {item.last_activity_at ? (
            <>
              <span aria-hidden="true">·</span>
              <span>active {formatRelative(item.last_activity_at)}</span>
            </>
          ) : null}
        </p>
      </div>

      <Button asChild size="sm" className="w-full shrink-0 sm:w-auto">
        <Link to={paths.course(course.id)} aria-label={`Resume ${course.title}`}>
          <Play aria-hidden="true" />
          Resume
        </Link>
      </Button>
    </Card>
  );
}

interface ContinueLearningSectionProps {
  items: CourseProgress[];
}

/** "Continue learning" — quick-resume cards for in-progress courses. */
export function ContinueLearningSection({ items }: ContinueLearningSectionProps) {
  return (
    <section aria-labelledby="continue-learning-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          id="continue-learning-heading"
          className="font-display text-headline-md text-on-surface"
        >
          Continue learning
        </h2>
        <Button variant="link" size="sm" asChild className="h-auto px-0">
          <Link to={paths.progress}>
            View progress
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses in progress"
          description="When you enroll in a course, your progress and a quick resume link will show up here."
          action={
            <Button asChild>
              <Link to={paths.courses}>Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <CourseProgressItem key={item.course.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

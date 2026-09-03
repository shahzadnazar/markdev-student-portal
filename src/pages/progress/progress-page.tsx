import { motion } from "framer-motion";
import {
  Clock,
  Flame,
  GraduationCap,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgress } from "@/hooks/use-engagement";
import { formatCompact, formatDuration } from "@/lib/format";
import type { ProgressOverview } from "@/types";
import { CourseProgressGroups } from "./course-progress-groups";
import { LearningProgressCard } from "@/components/charts/learning-progress-card";

function ProgressStats({ overview }: { overview: ProgressOverview }) {
  // Unused while the "In progress" StatCard below is commented out.
  // const inProgressCount = Math.max(
  //   0,
  //   overview.enrolled_courses - overview.completed_courses,
  // );

  return (
    <section
      aria-label="Progress summary"
      className="grid grid-cols-2 gap-4 md:grid-cols-3"
    >
      <StatCard
        label="Enrolled course"
        value={overview.courses[0]?.course.title ?? "No course"}
        icon={GraduationCap}
        hint="Your current course"
        className="min-w-0"
      />
      {/* <StatCard
        label="Courses completed"
        value={overview.completed_courses}
        icon={CheckCircle2}
        tone="success"
        hint="Finished end to end"
      /> */}
      <StatCard
        label="Lessons completed"
        value={formatCompact(overview.completed_lessons)}
        icon={ListChecks}
        hint="Across all courses"
      />
      <StatCard
        label="Total time"
        value={formatDuration(overview.total_time_minutes)}
        icon={Clock}
        hint="All-time learning"
      />
      <StatCard
        label="Current streak"
        value={`${overview.current_streak_days}d`}
        icon={Flame}
        tone="warning"
        hint={`Longest: ${overview.longest_streak_days} days`}
      />
      <StatCard
        label="Points"
        value={formatCompact(overview.points)}
        icon={Sparkles}
        tone="secondary"
        hint="Climb the leaderboard"
      />
    </section>
  );
}

/** Loading placeholder mirroring the stats grid, chart card and course rows. */
function ProgressSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} className="gap-4 p-6">
            <Skeleton className="size-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </Card>

      <div className="space-y-4">
        <Skeleton className="h-7 w-44" />
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="flex-row items-center gap-5 p-5">
            <Skeleton className="h-20 w-32 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProgressContent({ overview }: { overview: ProgressOverview }) {
  return (
    <div className="space-y-10">
      <ProgressStats overview={overview} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <LearningProgressCard progress={overview.progress} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      >
        <CourseProgressGroups courses={overview.courses} />
      </motion.div>
    </div>
  );
}

/** My progress — overall stats, weekly activity chart and per-course progress. */
export default function ProgressPage() {
  const progressQuery = useProgress();

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title="My progress"
        description="Every course, lesson and minute of learning — tracked in one place."
      />

      {progressQuery.isPending ? (
        <ProgressSkeleton />
      ) : progressQuery.isError ? (
        <ErrorState
          error={progressQuery.error}
          onRetry={() => {
            void progressQuery.refetch();
          }}
        />
      ) : progressQuery.data ? (
        <ProgressContent overview={progressQuery.data} />
      ) : null}
    </div>
  );
}

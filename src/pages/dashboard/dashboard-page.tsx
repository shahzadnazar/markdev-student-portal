import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  ClipboardList,
  Clock,
  Flame,
  GraduationCap,
  Trophy,
  Plane,
  FileQuestion,
  NotebookPen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/shared/error-state";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useDashboard } from "@/hooks/use-engagement";
import { formatCompact, formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types";
import { LearningProgressCard } from "@/components/charts/learning-progress-card";
import { AnnouncementsCard } from "./announcements-card";
import { ContinueLearningSection } from "./continue-learning-section";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { UpcomingCard } from "./upcoming-card";
import { paths } from "@/routes/paths";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface GreetingHeaderProps {
  name: string | undefined;
  streakDays: number | undefined;
  isLoading: boolean;
}

function GreetingHeader({ name, streakDays, isLoading }: GreetingHeaderProps) {
  const now = new Date();
  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-5 flex flex-wrap items-end justify-between gap-4"
    >
      <div className="min-w-0">
        <p className="mb-1 font-mono text-label-sm text-primary uppercase">
          {format(now, "EEEE")} · {formatDate(now)}
        </p>
        <h1 className="font-display text-headline-md text-on-surface">
          {greetingForHour(now.getHours())}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
          Your classes, deadlines and progress at a glance.
        </p>
      </div>

      {streakDays != null ? (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 shadow-card",
            streakDays > 0
              ? "bg-gradient-brand text-on-primary"
              : "bg-white text-on-surface-variant",
          )}
        >
          <Flame className="size-4" aria-hidden="true" />
          <span className="font-mono text-label-sm uppercase">
            {streakDays > 0 ? `${streakDays}-day streak` : "Start a streak today"}
          </span>
        </div>
      ) : isLoading ? (
        <Skeleton className="h-10 w-40 rounded-full" />
      ) : null}
    </motion.header>
  );
}

// function StatsGrid({ stats }: { stats: DashboardData["stats"] }) {
//   const pendingQuizzesHint =
//     stats.pending_quizzes > 0
//       ? `Plus ${stats.pending_quizzes} pending ${stats.pending_quizzes === 1 ? "quiz" : "quizzes"}`
//       : "You're all caught up";

//   return (
//     <section aria-label="Your learning stats" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
//       <StatCard
//         label="Enrolled courses"
//         value={stats.enrolled_courses}
//         icon={GraduationCap}
//         hint={`${stats.completed_courses} completed`}
//       />
//       <StatCard
//         label="Hours learned"
//         value={formatCompact(stats.hours_learned)}
//         icon={Clock}
//         hint={`${formatCompact(stats.completed_lessons)} lessons completed`}
//       />
//       <StatCard
//         label="Pending assignments"
//         value={stats.pending_assignments}
//         icon={ClipboardList}
//         tone={stats.pending_assignments > 0 ? "warning" : "primary"}
//         hint={pendingQuizzesHint}
//       />
//       <StatCard
//         label="Certificates"
//         value={stats.certificates_earned}
//         icon={Award}
//         tone="secondary"
//         hint="Earned to date"
//       />
//       <StatCard
//         className="col-span-2"
//         label="Attendance rate"
//         value={formatPercent(stats.attendance_rate)}
//         icon={CalendarCheck}
//         tone={stats.attendance_rate >= 75 ? "success" : "warning"}
//         hint="Across your live sessions"
//       />
//       <StatCard
//         className="col-span-2"
//         label="Points"
//         value={formatCompact(stats.points)}
//         icon={Trophy}
//         hint="Collect points to climb the leaderboard"
//       />
//     </section>
//   );
// }
function StatsGrid({ stats }: { stats: DashboardData["stats"] }) {
  const pendingQuizzesHint =
    stats.pending_quizzes > 0
      ? `${stats.pending_quizzes} pending ${
          stats.pending_quizzes === 1 ? "quiz" : "quizzes"
        }`
      : "You're all caught up";

  return (
    <section
      aria-label="Your learning stats"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      <Link
        to={paths.courses}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <StatCard
          label="Enrolled courses"
          value={stats.enrolled_courses}
          icon={GraduationCap}
          hint={`${stats.completed_courses} completed`}
          className="h-full transition-transform duration-200 hover:-translate-y-0.5"
        />
      </Link>

      <Link
        to={paths.progress}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <StatCard
          label="Hours learned"
          value={formatCompact(stats.hours_learned)}
          icon={Clock}
          hint={`${formatCompact(stats.completed_lessons)} lessons completed`}
          className="h-full transition-transform duration-200 hover:-translate-y-0.5"
        />
      </Link>

      <Link
        to={paths.assignments}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <StatCard
          label="Pending assignments"
          value={stats.pending_assignments}
          icon={ClipboardList}
          tone={stats.pending_assignments > 0 ? "warning" : "primary"}
          hint={
            stats.pending_assignments > 0
              ? `${stats.pending_assignments} ${
                  stats.pending_assignments === 1
                    ? "assignment"
                    : "assignments"
                } to complete`
              : "You're all caught up"
          }
          className="h-full transition-transform duration-200 hover:-translate-y-0.5"
        />
      </Link>

      <Link
        to={paths.quizzes}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <StatCard
          label="Quizzes"
          value={stats.pending_quizzes}
          icon={FileQuestion}
          tone={stats.pending_quizzes > 0 ? "secondary" : "primary"}
          hint={pendingQuizzesHint}
          className="h-full transition-transform duration-200 hover:-translate-y-0.5"
        />
      </Link>

      <Link
        to={paths.notes}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <StatCard
          label="My notes"
          value="View"
          icon={NotebookPen}
          tone="secondary"
          hint="Open your saved notes"
          className="h-full transition-transform duration-200 hover:-translate-y-0.5"
        />
      </Link>

      <Link
        to={paths.attendance}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <StatCard
          label="Attendance rate"
          value={formatPercent(stats.attendance_rate)}
          icon={CalendarCheck}
          tone={stats.attendance_rate >= 75 ? "success" : "warning"}
          hint="Across your live sessions"
          className="h-full transition-transform duration-200 hover:-translate-y-0.5"
        />
      </Link>

      <Link
        to={paths.leaderboard}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <StatCard
          label="Points"
          value={formatCompact(stats.points)}
          icon={Trophy}
          hint="Collect points"
          className="h-full transition-transform duration-200 hover:-translate-y-0.5"
        />
      </Link>
    </section>
  );
}

const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
} as const;

function DashboardContent({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      {data.stats.approved_leave_today ? (
        <p className="flex items-center gap-2.5 rounded-xl bg-success-container/60 px-4 py-3 text-body-sm text-on-success-container">
          <Plane className="size-4 shrink-0" aria-hidden="true" />
          You're on approved leave today — your attendance is marked as leave and counts as
          present.
        </p>
      ) : null}

      <StatsGrid stats={data.stats} />

      <motion.div {...sectionMotion} transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}>
        <ContinueLearningSection items={data.continue_learning} />
      </motion.div>

      <div className="grid items-stretch gap-6 lg:grid-cols-5">
        <motion.div
          {...sectionMotion}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="lg:col-span-3"
        >
          <LearningProgressCard progress={data.progress} />
        </motion.div>
        <motion.div
          {...sectionMotion}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="lg:col-span-2"
        >
          <UpcomingCard events={data.upcoming} />
        </motion.div>
      </div>

      <motion.div {...sectionMotion} transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}>
        <AnnouncementsCard announcements={data.recent_announcements} />
      </motion.div>
    </div>
  );
}

/** Student dashboard — greeting, stats, quick-resume, activity and updates. */
export default function DashboardPage() {
  const { user } = useAuth();
  const dashboardQuery = useDashboard();

  return (
    <div>
      <GreetingHeader
        name={user?.name}
        streakDays={dashboardQuery.data?.stats.current_streak_days}
        isLoading={dashboardQuery.isPending}
      />

      {dashboardQuery.isPending ? (
        <DashboardSkeleton />
      ) : dashboardQuery.isError ? (
        <ErrorState
          error={dashboardQuery.error}
          onRetry={() => {
            void dashboardQuery.refetch();
          }}
        />
      ) : dashboardQuery.data ? (
        <DashboardContent data={dashboardQuery.data} />
      ) : null}
    </div>
  );
}

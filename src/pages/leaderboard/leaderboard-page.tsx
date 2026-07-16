import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderboard } from "@/hooks/use-engagement";
import { initials } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { Leaderboard, LeaderboardEntry } from "@/types";
import { LeaderboardPodium } from "./leaderboard-podium";
import { LeaderboardTable } from "./leaderboard-table";

type Period = Leaderboard["period"];

const periodLabels: Record<Period, string> = {
  weekly: "This week",
  monthly: "This month",
  all_time: "All time",
};

/** Loading placeholder mirroring the podium and ranking rows. */
function LeaderboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl sm:h-60" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="divide-y divide-outline-variant/30">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-3.5">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Sticky "Your rank" strip shown when the viewer is outside the listed ranks. */
function YourRankCard({ me }: { me: LeaderboardEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      className="sticky bottom-4 z-10"
    >
      <Card
        className="flex-row items-center gap-4 border border-primary/20 bg-white/95 px-5 py-4 shadow-elevated backdrop-blur"
        aria-label="Your rank"
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-label-sm text-primary uppercase">Your rank</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-label-md font-semibold text-on-surface">
              #{me.rank}
            </span>
            <Avatar className="size-9">
              {me.user.avatar_url ? <AvatarImage src={me.user.avatar_url} alt="" /> : null}
              <AvatarFallback className="text-body-sm">{initials(me.user.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-body-sm font-medium text-on-surface">
              {me.user.name}
            </span>
            <Badge variant="primary">You</Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden items-center gap-1.5 font-mono text-label-md text-on-surface-variant sm:inline-flex">
            <Flame className="size-3.5 text-warning" aria-hidden="true" />
            {me.streak_days}d
          </span>
          <span className="hidden font-mono text-label-md text-on-surface-variant md:inline">
            {me.courses_completed} courses
          </span>
          <span className="font-mono text-label-md font-semibold text-on-surface">
            {me.points.toLocaleString()} pts
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

function LeaderboardContent({ data, period }: { data: Leaderboard; period: Period }) {
  if (data.entries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No rankings yet"
        description={`Earn points by completing lessons, quizzes and assignments — the ${periodLabels[period].toLowerCase()} leaderboard fills up as learners make progress.`}
        action={
          <Button asChild>
            <Link to={paths.courses}>Browse courses</Link>
          </Button>
        }
      />
    );
  }

  const rest = data.entries.slice(3);
  const showMeCard = data.me !== null && data.me.rank > data.entries.length;

  return (
    <div className="space-y-6">
      <LeaderboardPodium entries={data.entries} />
      <LeaderboardTable entries={rest} />
      {showMeCard && data.me ? <YourRankCard me={data.me} /> : null}
    </div>
  );
}

/** Community leaderboard — weekly, monthly and all-time point rankings. */
export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const leaderboardQuery = useLeaderboard(period);

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Leaderboard"
        description="See how your learning stacks up against fellow students."
      />

      <Tabs
        value={period}
        onValueChange={(value) => {
          setPeriod(value as Period);
        }}
        className="mb-6"
      >
        <TabsList aria-label="Leaderboard period">
          {(Object.keys(periodLabels) as Period[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {periodLabels[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {leaderboardQuery.isPending ? (
        <LeaderboardSkeleton />
      ) : leaderboardQuery.isError ? (
        <ErrorState
          error={leaderboardQuery.error}
          onRetry={() => {
            void leaderboardQuery.refetch();
          }}
        />
      ) : leaderboardQuery.data ? (
        <LeaderboardContent data={leaderboardQuery.data} period={period} />
      ) : null}
    </div>
  );
}

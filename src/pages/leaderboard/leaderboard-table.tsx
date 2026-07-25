import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

const headerCell = "px-6 py-3 font-mono text-label-sm font-medium text-on-surface-variant uppercase";

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.03, ease: "easeOut" }}
      className={cn(
        "border-b border-outline-variant/30 transition-colors duration-150 last:border-0",
        entry.is_me ? "bg-primary/[0.06]" : "hover:bg-surface-container-low/60",
      )}
    >
      <td className="px-6 py-3.5 font-mono text-label-md text-on-surface-variant">
        {entry.rank}
      </td>
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            {entry.user.avatar_url ? <AvatarImage src={entry.user.avatar_url} alt="" /> : null}
            <AvatarFallback className="text-body-sm">{initials(entry.user.name)}</AvatarFallback>
          </Avatar>
          <span className="max-w-48 truncate text-body-sm font-medium text-on-surface">
            {entry.user.name}
          </span>
          {entry.is_me ? <Badge variant="primary">You</Badge> : null}
        </div>
      </td>
      <td className="px-6 py-3.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-label-md text-on-surface-variant">
          <Flame className="size-3.5 text-warning" aria-hidden="true" />
          {entry.streak_days}d
        </span>
      </td>
      <td className="px-6 py-3.5 font-mono text-label-md text-on-surface-variant">
        {entry.courses_completed}
      </td>
      <td className="px-6 py-3.5 text-right font-mono text-label-md font-semibold text-on-surface">
        {entry.points.toLocaleString()}
      </td>
    </motion.tr>
  );
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

/** Ranks below the podium, as a scannable table card. */
export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) return null;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Mobile: stacked rows instead of a horizontally-scrolling table */}
      <ul className="divide-y divide-outline-variant/30 md:hidden">
        {entries.map((entry, index) => (
          <li
            key={entry.user.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              entry.is_me && "bg-primary/[0.06]",
            )}
          >
            <span className="w-8 shrink-0 font-mono text-body-sm text-on-surface-variant">
              #{index + 4}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium text-on-surface">
                {entry.user.name}
                {entry.is_me ? " (you)" : ""}
              </p>
              <p className="font-mono text-label-sm text-on-surface-variant">
                {entry.streak_days}d streak · {entry.courses_completed} courses
              </p>
            </div>
            <span className="shrink-0 font-mono text-body-sm font-semibold text-on-surface">
              {entry.points.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[36rem] text-left">
          <caption className="sr-only">Leaderboard rankings below the top three</caption>
          <thead>
            <tr className="border-b border-outline-variant/50">
              <th scope="col" className={cn(headerCell, "w-16")}>
                Rank
              </th>
              <th scope="col" className={headerCell}>
                Learner
              </th>
              <th scope="col" className={headerCell}>
                Streak
              </th>
              <th scope="col" className={headerCell}>
                Courses
              </th>
              <th scope="col" className={cn(headerCell, "text-right")}>
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <LeaderboardRow key={entry.user.id} entry={entry} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

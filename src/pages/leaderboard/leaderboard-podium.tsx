import { motion } from "framer-motion";
import { Crown, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

/** Medal tints — gold via warning, silver neutral, bronze via tertiary. */
const medalStyles: Record<number, string> = {
  1: "bg-warning-container text-on-warning-container",
  2: "bg-surface-container-high text-on-surface-variant",
  3: "bg-tertiary-fixed text-on-tertiary-fixed",
};

/** Desktop visual order 2-1-3 while keeping logical DOM order 1-2-3. */
const spotOrder: Record<number, string> = {
  1: "sm:order-2",
  2: "sm:order-1",
  3: "sm:order-3",
};

function PodiumSpot({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isFirst = entry.rank === 1;

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center rounded-2xl px-4 text-center",
        spotOrder[entry.rank],
        isFirst
          ? "bg-gradient-to-b from-primary/10 via-secondary/[0.06] to-transparent py-8 ring-1 ring-primary/10"
          : "bg-surface-container-low/70 py-6",
      )}
    >
      {isFirst ? <Crown className="mb-2 size-5 text-warning" aria-hidden="true" /> : null}

      <div className="relative">
        <Avatar className={cn(isFirst ? "size-20" : "size-14")}>
          {entry.user.avatar_url ? (
            <AvatarImage src={entry.user.avatar_url} alt="" />
          ) : null}
          <AvatarFallback className={isFirst ? "text-body-lg" : "text-body-sm"}>
            {initials(entry.user.name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-2 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full font-mono text-label-sm ring-2 ring-white",
            medalStyles[entry.rank] ?? medalStyles[3],
          )}
          aria-label={`Rank ${entry.rank}`}
        >
          {entry.rank}
        </span>
      </div>

      <p className="mt-4 w-full truncate text-body-md font-semibold text-on-surface">
        {entry.user.name}
      </p>
      {entry.is_me ? <Badge variant="primary" className="mt-1">You</Badge> : null}

      <p className="mt-1.5 font-mono text-label-md font-semibold text-on-surface">
        {entry.points.toLocaleString()} pts
      </p>
      <p className="mt-1 flex items-center gap-1 font-mono text-label-sm text-on-surface-variant">
        <Flame className="size-3.5 text-warning" aria-hidden="true" />
        {entry.streak_days}d streak
      </p>
    </motion.li>
  );
}

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
}

/** Top-three podium — #1 celebrated in the center on desktop. */
export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const topThree = entries.slice(0, 3);
  if (topThree.length === 0) return null;

  return (
    <ol
      aria-label="Top three learners"
      className="grid list-none grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
    >
      {topThree.map((entry, index) => (
        <PodiumSpot key={entry.user.id} entry={entry} index={index} />
      ))}
    </ol>
  );
}

import { useEffect, useRef, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

function secondsUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 1000);
}

interface QuizTimerProps {
  /** ISO timestamp the attempt expires at. */
  expiresAt: string;
  /** Fired exactly once when the countdown reaches zero. */
  onExpire: () => void;
  className?: string;
}

/**
 * Countdown pill for a timed attempt. Re-derives the remaining time from
 * `expiresAt` every second (so it stays honest across tab throttling),
 * turns red inside the final minute and fires `onExpire` once at zero.
 */
export function QuizTimer({ expiresAt, onExpire, className }: QuizTimerProps) {
  const [remaining, setRemaining] = useState(() => secondsUntil(expiresAt));

  // Keep the latest callback without restarting the interval.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let expired = false;
    const tick = () => {
      const next = secondsUntil(expiresAt);
      setRemaining(next);
      if (next <= 0 && !expired) {
        expired = true;
        window.clearInterval(id);
        onExpireRef.current();
      }
    };
    const id = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const isLow = remaining <= 60;

  return (
    <div
      role="timer"
      aria-live={isLow ? "assertive" : "off"}
      aria-label={`Time remaining: ${formatClock(remaining)}`}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-label-md tabular-nums transition-colors duration-300",
        isLow ? "bg-error-container/60 text-error" : "bg-surface-container-low text-on-surface",
        className,
      )}
    >
      <TimerIcon className="size-4 shrink-0" aria-hidden="true" />
      <span>{formatClock(remaining)}</span>
    </div>
  );
}

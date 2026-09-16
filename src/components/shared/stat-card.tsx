import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useId } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  /**
   * Optional. Every caller passes one today, but a card without one must not
   * leave a hole where it would have been — see the layout note below.
   */
  icon?: LucideIcon;
  /** Small helper line under the value, e.g. "+3 this week". */
  hint?: string;
  /** Denser padding and a smaller icon, for a row of five or six tiles. */
  hintBelow?: boolean;
  tone?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
};

/**
 * Past this many characters the value is prose, not a figure.
 *
 * Almost every value here is short — "88%", "1.2K", "18h 33m", "9" — and reads
 * best at headline-lg. But the progress page passes a COURSE TITLE through the
 * same prop ("React 19 Patterns"), and 2rem type turns that into three wrapped
 * lines that dwarf the card. Long values step back down to headline-md, which
 * is what every value used to be, so nothing regresses and the short ones get
 * the promotion.
 */
const LONG_VALUE = 10;

/**
 * A figure, what it measures, and an optional note — in that order.
 *
 * THE NUMBER LEADS. It used to come third, under the icon and the label, so
 * the thing a student actually opened the page for was the last thing they
 * read. It now sits at the top-left, which in this reading direction is where
 * the eye lands first, and it is a size larger than it was.
 *
 * THE ICON MOVED TO THE TOP-RIGHT. Beside the number it competed with it —
 * a filled 44px tile next to 32px type reads as the louder element, which is
 * the problem this change exists to fix. Dropped entirely it would take the
 * tone colour with it, and that colour is doing real work: it is how a warning
 * card for absences reads differently from a success card for present days at
 * a glance. In the opposite corner it keeps the tone, marks the card, and
 * cannot crowd the figure. It also costs nothing when absent: the row is a
 * flex with the value on flex-1, so with no icon the value simply spans the
 * width and no gap is left behind.
 *
 * READING IT ALOUD. DOM order matches visual order — number, label, hint — as
 * it must, but "88%" on its own means nothing. The card is a group named by
 * its label, so a screen reader announces "Attendance rate, group" on entry
 * and then reads the contents in order. The figure is never orphaned.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  hintBelow = false,
  tone = "primary",
  className,
}: StatCardProps) {
  const labelId = useId();
  const isLongValue = String(value).length > LONG_VALUE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      <Card
        role="group"
        aria-labelledby={labelId}
        className={cn(
          "flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-card",
          hintBelow ? "p-4" : "p-6",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "min-w-0 flex-1 font-display text-on-surface",
              // break-words, not truncate: a long value is a course title, and
              // half a title with an ellipsis is less use than two lines.
              "text-balance break-words",
              isLongValue ? "text-headline-md" : "text-headline-lg",
            )}
          >
            {value}
          </p>

          {Icon ? (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl",
                hintBelow ? "size-9" : "size-10",
                toneStyles[tone],
              )}
            >
              <Icon className={hintBelow ? "size-4.5" : "size-5"} aria-hidden="true" />
            </div>
          ) : null}
        </div>

        <p
          id={labelId}
          className="mt-1 font-mono text-label-sm text-on-surface-variant uppercase"
        >
          {label}
        </p>

        {hint ? (
          <p className="mt-1 text-body-sm text-balance text-on-surface-variant">{hint}</p>
        ) : null}
      </Card>
    </motion.div>
  );
}

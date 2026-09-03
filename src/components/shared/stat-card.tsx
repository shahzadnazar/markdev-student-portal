import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Small helper line under the value, e.g. "+3 this week". */
  hint?: string;
  /**
   * Put the hint on its own row beneath the icon and value.
   *
   * Beside the icon the hint shares a narrow column and is truncated, which
   * silently eats anything longer than a couple of words. On its own row it has
   * the full card width and wraps, so a hint can be a sentence.
   */
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

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  hintBelow = false,
  tone = "primary",
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      <Card
        className={cn(
          "flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-card",
          hintBelow ? "p-4" : "p-6",
        )}
      >
        <div className={cn("flex items-start", hintBelow ? "gap-3" : "gap-4")}>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl",
              hintBelow ? "size-10" : "size-11",
              toneStyles[tone],
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-mono text-label-sm text-on-surface-variant uppercase",
                // A two-word label wraps in a narrow card while its neighbours
                // keep one line, which drops that card's value a row below the
                // others. Reserving two lines keeps every value on one baseline;
                // bottom-aligning inside that block keeps the one-line labels
                // sitting right on top of their value instead of a line above.
                hintBelow && "flex min-h-8 items-end",
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "font-display text-headline-md text-on-surface",
                hintBelow ? "mt-0.5" : "mt-1",
              )}
            >
              {value}
            </p>
            {hint && ! hintBelow ? (
              <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">{hint}</p>
            ) : null}
          </div>
        </div>
        {hint && hintBelow ? (
          <p className="mt-2 text-body-sm text-balance text-on-surface-variant">{hint}</p>
        ) : null}
      </Card>
    </motion.div>
  );
}

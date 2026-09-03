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
      <Card className="flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-card">
        <div className="flex items-start gap-4">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", toneStyles[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-mono text-label-sm text-on-surface-variant uppercase",
                // A two-word label wraps in a narrow card while its neighbours
                // keep one line, which drops that card's value a row below the
                // others. Reserving two lines keeps every value on one baseline.
                hintBelow && "min-h-8",
              )}
            >
              {label}
            </p>
            <p className="mt-1 font-display text-headline-md text-on-surface">{value}</p>
            {hint && ! hintBelow ? (
              <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">{hint}</p>
            ) : null}
          </div>
        </div>
        {hint && hintBelow ? (
          <p className="mt-auto pt-3 text-body-sm text-balance text-on-surface-variant">
            {hint}
          </p>
        ) : null}
      </Card>
    </motion.div>
  );
}

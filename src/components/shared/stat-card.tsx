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
  tone?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "primary", className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      <Card className="flex items-start gap-4 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:shadow-card">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-label-sm text-on-surface-variant uppercase">{label}</p>
          <p className="mt-1 font-display text-headline-md text-on-surface">{value}</p>
          {hint ? <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">{hint}</p> : null}
        </div>
      </Card>
    </motion.div>
  );
}

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Small mono eyebrow above the title, e.g. "LEARNING". */
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("mb-5 flex flex-wrap items-end justify-between gap-4", className)}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 font-mono text-label-sm text-primary uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-headline-md text-on-surface">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </motion.header>
  );
}

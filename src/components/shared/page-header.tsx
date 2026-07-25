import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omit for the current page (rendered as plain text with aria-current). */
  to?: string;
}

interface PageHeaderProps {
  /** Small mono eyebrow above the title, e.g. "LEARNING". */
  eyebrow?: string;
  /** Breadcrumb trail — when given it replaces the eyebrow. */
  crumbs?: Crumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, crumbs, title, description, actions, className }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("mb-5 flex flex-wrap items-end justify-between gap-4", className)}
    >
      <div className="min-w-0">
        {crumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-1">
            <ol className="flex flex-wrap items-center gap-1.5 font-mono text-label-sm text-outline uppercase">
              {crumbs.map((crumb, index) => (
                <li key={crumb.label + index} className="flex items-center gap-1.5">
                  {crumb.to ? (
                    <Link to={crumb.to} className="rounded-sm transition hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-on-surface-variant">
                      {crumb.label}
                    </span>
                  )}
                  {index < crumbs.length - 1 && <span aria-hidden="true">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        ) : eyebrow ? (
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

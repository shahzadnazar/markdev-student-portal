import { cn } from "@/lib/utils";

/** The MarkDev logo mark — gradient tile with an "M" wave. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-gradient-brand flex size-9 shrink-0 items-center justify-center rounded-lg text-white",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
        <path
          d="M4 17V7.5L9 14l3-4 3 4 5-6.5V17"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <BrandMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-body-lg font-bold tracking-tight text-on-surface">
            MarkDev
          </span>
          <span className="mt-0.5 font-mono text-[10px] tracking-[0.08em] text-on-surface-variant uppercase">
            Learn • Build • Grow
          </span>
        </span>
      )}
    </span>
  );
}

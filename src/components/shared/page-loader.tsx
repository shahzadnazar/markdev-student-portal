import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface PageLoaderProps {
  /** Covers the whole viewport (used during session bootstrap). */
  fullScreen?: boolean;
  label?: string;
  className?: string;
}

export function PageLoader({ fullScreen = false, label = "Loading", className }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen ? "min-h-screen bg-surface-ice" : "min-h-64 w-full py-10",
        className,
      )}
    >
      <Spinner className="size-7" />
      <span className="font-mono text-label-sm text-on-surface-variant uppercase">{label}…</span>
    </div>
  );
}

import { RefreshCcw, TriangleAlert } from "lucide-react";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, title = "Something went wrong", onRetry, className }: ErrorStateProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : "We couldn't load this right now. Please try again in a moment.";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-error/20 bg-error-container/30 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-error-container">
        <TriangleAlert className="size-7 text-on-error-container" aria-hidden="true" />
      </div>
      <h3 className="font-display text-headline-md text-on-surface">{title}</h3>
      <p className="mt-1.5 max-w-md text-body-sm text-on-surface-variant">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onRetry}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

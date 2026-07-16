import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface PaginationBarProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageToken = number | "ellipsis-start" | "ellipsis-end";

/** Sliding window of at most 5 numbered pages, with ellipsis markers. */
function getPageWindow(current: number, last: number): PageToken[] {
  if (last <= 5) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const start = Math.max(1, Math.min(current - 2, last - 4));
  const end = start + 4;
  const tokens: PageToken[] = [];
  if (start > 1) tokens.push("ellipsis-start");
  for (let page = start; page <= end; page += 1) tokens.push(page);
  if (end < last) tokens.push("ellipsis-end");
  return tokens;
}

function PaginationBar({ meta, onPageChange, className }: PaginationBarProps) {
  const { current_page, last_page, total, from, to } = meta;

  if (last_page <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-4", className)}
    >
      <p className="font-mono text-label-sm text-on-surface-variant">
        Showing {from ?? 0}–{to ?? 0} of {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Previous page"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>

        {getPageWindow(current_page, last_page).map((token) =>
          typeof token === "number" ? (
            <Button
              key={token}
              variant={token === current_page ? "primary" : "ghost"}
              size="icon"
              className="size-8 font-mono text-label-sm"
              aria-label={`Page ${token}`}
              aria-current={token === current_page ? "page" : undefined}
              onClick={() => onPageChange(token)}
            >
              {token}
            </Button>
          ) : (
            <span
              key={token}
              aria-hidden="true"
              className="px-1 font-mono text-label-sm text-on-surface-variant"
            >
              …
            </span>
          ),
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Next page"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

export { PaginationBar };

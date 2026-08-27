import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";
import type { LiveAnnouncement } from "@/types";

/** Bodies may carry basic HTML; the ticker is one line of plain text. */
function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Long bodies would stall the loop, so they are cut at a word boundary. */
function summarise(body: string, limit = 180): string {
  const text = plainText(body);
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return cut.slice(0, cut.lastIndexOf(" ") || limit) + "…";
}

/**
 * Scrolling band of the announcements staff have posted in the last 24 hours.
 *
 * The track holds two identical runs and slides by exactly half its width, so
 * the sequence meets its own start and the loop has no seam. Each run is at
 * least as wide as the viewport, which keeps the second copy off screen —
 * without that, a short notice would appear twice side by side.
 */
export function AnnouncementTicker({ items }: { items: LiveAnnouncement[] }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  // Each run must be at least the viewport wide or the second copy shows up
  // alongside the first. `min-w-full` can't express that: the run's containing
  // block is the content-sized track, not the viewport, so it is measured.
  const [runWidth, setRunWidth] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => setRunWidth(viewport.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
    // Depends on items: the first render has none, so the viewport isn't in the
    // DOM yet and there is nothing to measure until announcements arrive.
  }, [items.length]);

  if (items.length === 0) return null;

  const entries = items.map((item) => ({
    id: item.id,
    title: item.title,
    body: summarise(item.body ?? ""),
  }));

  const text = entries
    .map((entry) => (entry.body ? `${entry.title}: ${entry.body}` : entry.title))
    .join("   •   ");

  // Roughly 40 characters a second reads comfortably; never faster than 24s.
  const seconds = Math.max(24, Math.round(text.length / 40) * 2 + 16);

  const run = (key: string) => (
    <div
      key={key}
      aria-hidden={key === "clone"}
      className="flex shrink-0 items-center gap-10 pr-10"
      style={{ minWidth: runWidth ? `${runWidth}px` : undefined }}
    >
      {entries.map((entry) => (
        <Link
          key={`${key}-${entry.id}`}
          to={paths.announcements}
          className="shrink-0 text-body-sm whitespace-nowrap text-on-surface transition-colors hover:text-primary"
        >
          <span className="font-semibold">{entry.title}</span>
          {entry.body ? (
            <span className="text-on-surface-variant">: {entry.body}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );

  return (
    <div
      className={
        // A tinted band rather than loose text on the bar: it marks the strip as
        // one thing and stops the moving words reading as page content.
        "group relative hidden min-w-0 flex-1 items-center gap-2.5 rounded-full " +
        "bg-primary/[0.06] py-1.5 pr-2 pl-3.5 ring-1 ring-primary/10 ring-inset md:flex"
      }
      role="status"
      aria-live="polite"
      aria-label={`Announcements: ${text}`}
    >
      <Megaphone className="size-4 shrink-0 text-primary" aria-hidden="true" />

      {/* Masked on the inner strip only, so the band stays solid while the words
          fade in and out at its edges. */}
      <div
        ref={viewportRef}
        className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)]"
      >
        <div
          className="flex w-max animate-[ticker_var(--ticker-duration)_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ ["--ticker-duration" as string]: `${seconds}s` }}
        >
          {run("main")}
          {run("clone")}
        </div>
      </div>
    </div>
  );
}

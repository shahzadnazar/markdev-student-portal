import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";
import type { LiveAnnouncement } from "@/types";

/**
 * Scrolling band of the announcements staff have posted in the last 24 hours.
 *
 * It only scrolls when the text is actually too wide for the space. A short
 * notice that fits sits still, because the seamless loop needs a second copy
 * of the run and that copy would otherwise be on screen — showing the same
 * headline twice side by side.
 */
export function AnnouncementTicker({ items }: { items: LiveAnnouncement[] }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const runRef = useRef<HTMLDivElement | null>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const run = runRef.current;
    if (!viewport || !run) return;

    const measure = () => setOverflows(run.scrollWidth > viewport.clientWidth);
    measure();

    // The available width changes with the window and with the sidebar.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(run);
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const text = items.map((item) => item.title).join("   •   ");
  // Roughly 40 characters a second reads comfortably; never faster than 20s.
  const seconds = Math.max(20, Math.round(text.length / 40) * 2 + 20);

  const run = (key: string, ref?: typeof runRef) => (
    <div
      ref={ref}
      key={key}
      aria-hidden={key === "clone"}
      className="flex shrink-0 items-center gap-8 pr-8"
    >
      {items.map((item) => (
        <Link
          key={`${key}-${item.id}`}
          to={paths.announcements}
          className="shrink-0 text-body-sm whitespace-nowrap text-on-surface transition-colors hover:text-primary"
        >
          <span className="font-semibold">{item.title}</span>
          {item.course ? (
            <span className="text-on-surface-variant"> · {item.course.title}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );

  return (
    <div
      className="group relative hidden min-w-0 flex-1 items-center gap-2 md:flex"
      role="status"
      aria-live="polite"
      aria-label={`Announcements: ${text}`}
    >
      <Megaphone className="size-4 shrink-0 text-primary" aria-hidden="true" />

      {/* Fades the text in and out at the edges instead of clipping it hard. */}
      <div
        ref={viewportRef}
        className={
          "relative min-w-0 flex-1 overflow-hidden" +
          (overflows
            ? " [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]"
            : "")
        }
      >
        <div
          className={
            "flex w-max" +
            (overflows
              ? " animate-[ticker_var(--ticker-duration)_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
              : "")
          }
          style={{ ["--ticker-duration" as string]: `${seconds}s` }}
        >
          {run("main", runRef)}
          {overflows ? run("clone") : null}
        </div>
      </div>
    </div>
  );
}

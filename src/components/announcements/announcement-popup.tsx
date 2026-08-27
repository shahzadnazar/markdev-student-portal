import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { LiveAnnouncement } from "@/types";

/**
 * Popup for announcements an instructor posted in the last 24 hours.
 *
 * Dismissal is deliberately held in component state and nowhere else: closing
 * clears it for this visit, and a reload brings it back until the announcement
 * falls out of its live window. Persisting the dismissal would let a student
 * clear it once and never see it again, which is the opposite of the intent.
 */
export function AnnouncementPopup({ items }: { items: LiveAnnouncement[] }) {
  const [dismissed, setDismissed] = useState<number[]>([]);

  // A newly arrived announcement should surface even if an earlier one was
  // closed during this same visit.
  useEffect(() => {
    setDismissed((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  const pending = items.filter((item) => !dismissed.includes(item.id));
  const current = pending[0];

  if (!current) return null;

  const close = () => setDismissed((previous) => [...previous, current.id]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:bottom-6 sm:justify-end sm:pr-6"
      role="dialog"
      aria-modal="false"
      aria-labelledby={`announcement-${current.id}-title`}
    >
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-elevated">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="size-4 text-primary" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-label-sm text-primary uppercase">
              {current.course ? current.course.title : "Announcement"}
            </p>
            <h2
              id={`announcement-${current.id}-title`}
              className="mt-1 font-display text-body-lg font-semibold text-on-surface"
            >
              {current.title}
            </h2>
            <p className="mt-1.5 line-clamp-4 text-body-sm whitespace-pre-line text-on-surface-variant">
              {current.body}
            </p>
            <p className="mt-2 font-mono text-label-sm text-outline">
              {current.author.name ?? "Instructor"} · {formatRelative(current.published_at)}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" asChild>
                <Link to={paths.announcements} onClick={close}>
                  Read announcements
                </Link>
              </Button>
              {pending.length > 1 ? (
                <span className="font-mono text-label-sm text-outline">
                  +{pending.length - 1} more
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label={`Close announcement: ${current.title}`}
            className="-mt-1 -mr-1 shrink-0 rounded-lg p-1.5 text-on-surface-variant transition hover:bg-surface-ice hover:text-on-surface"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

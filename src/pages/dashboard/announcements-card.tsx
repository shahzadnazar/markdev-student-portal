import { ArrowRight, Megaphone, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Announcement } from "@/types";

interface AnnouncementsCardProps {
  announcements: Announcement[];
  className?: string;
}

/** "Recent announcements" card — the latest posts from instructors. */
export function AnnouncementsCard({ announcements, className }: AnnouncementsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Recent announcements</CardTitle>
          <Button variant="link" size="sm" asChild className="h-auto px-0">
            <Link to={paths.announcements}>
              View all
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <CardDescription>The latest from your instructors and courses.</CardDescription>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-on-surface-variant">
            No announcements yet — check back soon.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {announcements.slice(0, 6).map((announcement) => (
              <li key={announcement.id} className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                    announcement.is_pinned
                      ? "bg-secondary/10 text-secondary"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {announcement.is_pinned ? (
                    <>
                      <Pin className="size-4" aria-hidden="true" />
                      <span className="sr-only">Pinned announcement</span>
                    </>
                  ) : (
                    <Megaphone className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "truncate text-body-md text-on-surface",
                        announcement.is_read ? "font-medium" : "font-semibold",
                      )}
                    >
                      {announcement.title}
                    </p>
                    {!announcement.is_read ? (
                      <span className="shrink-0">
                        <span className="block size-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span className="sr-only">Unread</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    {announcement.course ? (
                      <Badge variant="neutral" className="max-w-48">
                        <span className="truncate normal-case">{announcement.course.title}</span>
                      </Badge>
                    ) : null}
                    <span className="font-mono text-label-sm text-on-surface-variant">
                      {formatRelative(announcement.published_at)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

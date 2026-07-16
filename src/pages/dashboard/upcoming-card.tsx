import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarDays, ClipboardList, FileQuestion, Megaphone, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { CalendarEvent, CalendarEventType } from "@/types";

interface EventTypeConfig {
  icon: LucideIcon;
  label: string;
  badgeVariant: "primary" | "secondary" | "warning" | "neutral";
  iconClass: string;
}

const eventTypeConfig: Record<CalendarEventType, EventTypeConfig> = {
  assignment: {
    icon: ClipboardList,
    label: "Assignment",
    badgeVariant: "warning",
    iconClass: "bg-warning-container text-on-warning-container",
  },
  quiz: {
    icon: FileQuestion,
    label: "Quiz",
    badgeVariant: "secondary",
    iconClass: "bg-secondary/10 text-secondary",
  },
  live_session: {
    icon: Video,
    label: "Live",
    badgeVariant: "primary",
    iconClass: "bg-primary/10 text-primary",
  },
  announcement: {
    icon: Megaphone,
    label: "News",
    badgeVariant: "neutral",
    iconClass: "bg-surface-container text-on-surface-variant",
  },
  other: {
    icon: CalendarDays,
    label: "Event",
    badgeVariant: "neutral",
    iconClass: "bg-surface-container text-on-surface-variant",
  },
};

function UpcomingRow({ event }: { event: CalendarEvent }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

  const body = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          config.iconClass,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-medium text-on-surface">
          {event.title}
        </span>
        <span className="mt-0.5 block truncate font-mono text-label-sm text-on-surface-variant">
          {formatRelative(event.starts_at)}
          {event.course ? ` · ${event.course.title}` : ""}
        </span>
      </span>
      <Badge variant={config.badgeVariant} className="shrink-0">
        {config.label}
      </Badge>
    </>
  );

  return (
    <li>
      {event.action_url ? (
        <Link
          to={event.action_url}
          className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-ice"
        >
          {body}
        </Link>
      ) : (
        <div className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5">{body}</div>
      )}
    </li>
  );
}

interface UpcomingCardProps {
  events: CalendarEvent[];
  className?: string;
}

/** "Upcoming" card — the next deadlines, quizzes and live sessions. */
export function UpcomingCard({ events, className }: UpcomingCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Upcoming</CardTitle>
          <Button variant="link" size="sm" asChild className="h-auto px-0">
            <Link to={paths.calendar}>
              Calendar
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <CardDescription>What's next on your schedule.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {events.length === 0 ? (
          <p className="flex h-full min-h-32 items-center justify-center text-center text-body-sm text-on-surface-variant">
            Nothing scheduled — enjoy the breathing room.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {events.slice(0, 6).map((event) => (
              <UpcomingRow key={`${event.type}-${event.id}`} event={event} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

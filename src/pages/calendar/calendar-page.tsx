import {
  addMonths,
  compareAsc,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  Megaphone,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendar } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventType } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const typeConfig: Record<
  CalendarEventType,
  { icon: LucideIcon; chip: string; badge: "primary" | "secondary" | "warning" | "neutral"; label: string }
> = {
  assignment: {
    icon: ClipboardList,
    chip: "bg-warning-container text-on-warning-container",
    badge: "warning",
    label: "Assignment",
  },
  quiz: {
    icon: FileQuestion,
    chip: "bg-secondary/10 text-secondary",
    badge: "secondary",
    label: "Quiz",
  },
  live_session: {
    icon: Video,
    chip: "bg-primary/10 text-primary",
    badge: "primary",
    label: "Live session",
  },
  announcement: {
    icon: Megaphone,
    chip: "bg-surface-container text-on-surface-variant",
    badge: "neutral",
    label: "Announcement",
  },
  other: {
    icon: CalendarDays,
    chip: "bg-surface-container text-on-surface-variant",
    badge: "neutral",
    label: "Event",
  },
};

export default function CalendarPage() {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const from = format(gridStart, "yyyy-MM-dd");
  const to = format(gridEnd, "yyyy-MM-dd");

  const calendarQuery = useCalendar(from, to);
  const events = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    // Recompute only when the visible range actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = format(parseISO(event.starts_at), "yyyy-MM-dd");
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(event);
      } else {
        map.set(key, [event]);
      }
    }
    return map;
  }, [events]);

  const selectedEvents = selected ? (eventsByDay.get(format(selected, "yyyy-MM-dd")) ?? []) : [];

  const upcoming = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((event) => parseISO(event.starts_at) >= now)
      .sort((a, b) => compareAsc(parseISO(a.starts_at), parseISO(b.starts_at)))
      .slice(0, 5);
  }, [events]);

  function changeMonth(offset: number) {
    setMonth((current) => addMonths(current, offset));
    setSelected(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Planning"
        title="Calendar"
        description="Deadlines, quizzes and live sessions across your courses."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setMonth(new Date())}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </Button>
              <span className="min-w-36 text-center font-display text-body-lg font-semibold text-on-surface">
                {format(month, "MMMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Next month">
                <ChevronRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </>
        }
      />

      {calendarQuery.isError ? (
        <ErrorState
          title="Couldn't load your calendar"
          error={calendarQuery.error}
          onRetry={() => {
            void calendarQuery.refetch();
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          {/* Month grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          >
            <Card className="p-4 md:p-6">
              <div className="grid grid-cols-7 gap-px" role="grid" aria-label={format(month, "MMMM yyyy")}>
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday}
                    role="columnheader"
                    className="pb-3 text-center font-mono text-label-sm text-on-surface-variant uppercase"
                  >
                    {weekday}
                  </div>
                ))}

                {calendarQuery.isLoading
                  ? Array.from({ length: days.length }, (_, index) => (
                      <div key={index} className="min-h-24 p-1">
                        <Skeleton className="size-full min-h-22 rounded-xl" />
                      </div>
                    ))
                  : days.map((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const dayEvents = eventsByDay.get(key) ?? [];
                      const inMonth = isSameMonth(day, month);
                      const isSelected = selected != null && isSameDay(day, selected);

                      return (
                        <div key={key} role="gridcell" className="min-h-24 p-1">
                          <button
                            type="button"
                            onClick={() => setSelected(day)}
                            aria-label={`${formatDate(day)}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ""}`}
                            aria-pressed={isSelected}
                            className={cn(
                              "flex size-full flex-col items-stretch gap-1 rounded-xl p-1.5 text-left transition-colors duration-150",
                              inMonth ? "hover:bg-surface-ice" : "opacity-40 hover:bg-surface-ice",
                              isSelected && "bg-primary/[0.06] ring-1 ring-primary/40",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-7 items-center justify-center self-start rounded-full font-mono text-label-sm",
                                isToday(day)
                                  ? "bg-primary font-semibold text-on-primary"
                                  : "text-on-surface-variant",
                              )}
                            >
                              {format(day, "d")}
                            </span>

                            <span className="flex flex-col gap-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <span
                                  key={event.id}
                                  className={cn(
                                    "truncate rounded-md px-1.5 py-0.5 font-mono text-[10px] leading-4",
                                    typeConfig[event.type].chip,
                                  )}
                                >
                                  {event.title}
                                </span>
                              ))}
                              {dayEvents.length > 2 && (
                                <span className="px-1.5 font-mono text-[10px] leading-4 text-on-surface-variant">
                                  +{dayEvents.length - 2} more
                                </span>
                              )}
                            </span>
                          </button>
                        </div>
                      );
                    })}
              </div>
            </Card>
          </motion.div>

          {/* Side panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h2 className="mb-4 font-mono text-label-md text-on-surface uppercase">
                {selected ? `Events · ${formatDate(selected)}` : "Select a day"}
              </h2>
              {selected == null ? (
                <p className="text-body-sm text-on-surface-variant">
                  Pick a day in the grid to see its schedule.
                </p>
              ) : selectedEvents.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Nothing scheduled on this day.</p>
              ) : (
                <ul className="space-y-3">
                  {selectedEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 font-mono text-label-md text-on-surface uppercase">Upcoming</h2>
              {calendarQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  No upcoming events in this period.
                </p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const config = typeConfig[event.type];
  const Icon = config.icon;

  const body = (
    <>
      <div
        className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", config.chip)}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-semibold text-on-surface">{event.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-label-sm text-on-surface-variant">
          {format(parseISO(event.starts_at), "MMM d · h:mm a")}
          {event.course && <span className="truncate">· {event.course.title}</span>}
        </p>
      </div>
      <Badge variant={config.badge} className="shrink-0">
        {config.label}
      </Badge>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-xl border border-outline-variant/40 p-3 transition-colors duration-150";

  if (event.action_url) {
    return (
      <li>
        <Link to={event.action_url} className={cn(className, "hover:border-primary/40 hover:bg-surface-ice")}>
          {body}
        </Link>
      </li>
    );
  }
  return <li className={className}>{body}</li>;
}

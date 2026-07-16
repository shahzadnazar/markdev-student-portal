import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  CheckCheck,
  ClipboardList,
  FileQuestion,
  Megaphone,
  PartyPopper,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-engagement";
import { formatDayLabel, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

const PER_PAGE = 15;

/** Pick an icon from the notification type string. */
function iconFor(type: string): LucideIcon {
  const slug = type.toLowerCase();
  if (slug.includes("assignment")) return ClipboardList;
  if (slug.includes("quiz")) return FileQuestion;
  if (slug.includes("certificate")) return Award;
  if (slug.includes("announcement")) return Megaphone;
  return Bell;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const notificationsQuery = useNotifications({
    page,
    per_page: PER_PAGE,
    unread: unreadOnly || undefined,
  });
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data?.data ?? [];

  const groups = useMemo(() => {
    const byDay = new Map<string, AppNotification[]>();
    for (const notification of notifications) {
      const label = formatDayLabel(notification.created_at);
      const bucket = byDay.get(label);
      if (bucket) {
        bucket.push(notification);
      } else {
        byDay.set(label, [notification]);
      }
    }
    return [...byDay.entries()];
  }, [notifications]);

  function handleUnreadToggle(value: boolean) {
    setUnreadOnly(value);
    setPage(1);
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: () => toast.error("Couldn't mark notifications as read. Please try again."),
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Everything that needs your attention, in one place."
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch
                id="unread-only"
                checked={unreadOnly}
                onCheckedChange={handleUnreadToggle}
                aria-label="Show unread notifications only"
              />
              <Label htmlFor="unread-only" className="cursor-pointer text-on-surface-variant">
                Unread only
              </Label>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all as read
            </Button>
          </>
        }
      />

      <motion.section
        aria-label="Notifications"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        {notificationsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 6 }, (_, index) => (
              <NotificationSkeleton key={index} />
            ))}
          </div>
        ) : notificationsQuery.isError ? (
          <ErrorState
            title="Couldn't load notifications"
            error={notificationsQuery.error}
            onRetry={() => {
              void notificationsQuery.refetch();
            }}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="You're all caught up"
            description={
              unreadOnly
                ? "No unread notifications. Switch off the filter to see your full history."
                : "New notifications about your courses, grades and deadlines will appear here."
            }
            action={
              unreadOnly ? (
                <Button variant="secondary" onClick={() => handleUnreadToggle(false)}>
                  Show all notifications
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div
            className={cn(
              "space-y-8 transition-opacity duration-200",
              notificationsQuery.isPlaceholderData && notificationsQuery.isFetching && "opacity-60",
            )}
          >
            {groups.map(([day, items]) => (
              <section key={day} aria-label={day}>
                <h2 className="mb-3 font-mono text-label-sm text-on-surface-variant uppercase">{day}</h2>
                <ul className="space-y-2">
                  {items.map((notification, index) => (
                    <motion.li
                      key={notification.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
                    >
                      <NotificationRow notification={notification} />
                    </motion.li>
                  ))}
                </ul>
              </section>
            ))}

            {notificationsQuery.data && (
              <PaginationBar
                meta={notificationsQuery.data.meta}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </div>
        )}
      </motion.section>
    </div>
  );
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const Icon = iconFor(notification.type);
  const unread = notification.read_at === null;

  function handleActivate() {
    if (unread) {
      markRead.mutate(notification.id);
    }
    if (notification.data.action_url) {
      navigate(notification.data.action_url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl p-5 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated",
        unread ? "bg-primary/[0.04]" : "bg-white",
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          unread ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant",
        )}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {unread && <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-primary" />}
          <p className="min-w-0 truncate text-body-md font-semibold text-on-surface">
            {notification.data.title}
          </p>
        </div>
        <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">
          {notification.data.message}
        </p>
      </div>

      <span className="shrink-0 font-mono text-label-sm text-outline">
        {formatRelative(notification.created_at)}
      </span>
    </button>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-card">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-56 max-w-[60%]" />
        <Skeleton className="h-4 w-80 max-w-[85%]" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}

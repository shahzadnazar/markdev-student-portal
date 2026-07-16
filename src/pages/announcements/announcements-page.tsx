import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Megaphone, Pin } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncements, useMarkAnnouncementRead } from "@/hooks/use-engagement";
import { formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types";

const PER_PAGE = 10;

const richTextClasses =
  "space-y-4 text-body-md text-on-surface [&_a]:text-primary [&_a]:underline [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-xl [&_pre]:bg-inverse-surface [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-body-sm [&_pre]:text-inverse-on-surface [&_pre]:overflow-x-auto [&_code]:font-mono";

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const announcementsQuery = useAnnouncements({ page, per_page: PER_PAGE });
  const markRead = useMarkAnnouncementRead();

  const announcements = announcementsQuery.data?.data ?? [];

  function handleToggle(announcement: Announcement) {
    const opening = openId !== announcement.id;
    setOpenId(opening ? announcement.id : null);
    if (opening && !announcement.is_read && !markRead.isPending) {
      markRead.mutate(announcement.id);
    }
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setOpenId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Announcements"
        description="Updates from your instructors and the MarkDev team — pinned items stay at the top."
      />

      <motion.section
        aria-label="Announcements"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        {announcementsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <AnnouncementSkeleton key={index} />
            ))}
          </div>
        ) : announcementsQuery.isError ? (
          <ErrorState
            title="Couldn't load announcements"
            error={announcementsQuery.error}
            onRetry={() => {
              void announcementsQuery.refetch();
            }}
          />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="When your instructors or the MarkDev team post an update, it will land here."
          />
        ) : (
          <>
            <ul
              className={cn(
                "space-y-3 transition-opacity duration-200",
                announcementsQuery.isPlaceholderData && announcementsQuery.isFetching && "opacity-60",
              )}
            >
              {announcements.map((announcement, index) => (
                <motion.li
                  key={announcement.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.35), ease: "easeOut" }}
                >
                  <AnnouncementCard
                    announcement={announcement}
                    open={openId === announcement.id}
                    onToggle={() => handleToggle(announcement)}
                  />
                </motion.li>
              ))}
            </ul>

            {announcementsQuery.data && (
              <PaginationBar
                meta={announcementsQuery.data.meta}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}
      </motion.section>
    </div>
  );
}

function AnnouncementCard({
  announcement,
  open,
  onToggle,
}: {
  announcement: Announcement;
  open: boolean;
  onToggle: () => void;
}) {
  const contentId = `announcement-${announcement.id}-body`;

  return (
    <article className="rounded-2xl bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-4 rounded-2xl p-6 text-left transition-colors duration-150 hover:bg-surface-ice/60"
      >
        {announcement.is_pinned && (
          <Pin className="size-4 shrink-0 text-primary" aria-label="Pinned" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {!announcement.is_read && (
              <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-primary" />
            )}
            <h3
              className={cn(
                "min-w-0 truncate text-body-md text-on-surface",
                announcement.is_read ? "font-semibold" : "font-bold",
              )}
            >
              {announcement.title}
            </h3>
            {announcement.course && (
              <Badge variant="primary" className="max-w-48">
                <span className="min-w-0 truncate">{announcement.course.title}</span>
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={announcement.author.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="text-[9px]">{initials(announcement.author.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-body-sm text-on-surface-variant">
              {announcement.author.name}
            </span>
            <span className="font-mono text-label-sm text-outline">
              {formatRelative(announcement.published_at)}
            </span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-outline transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-outline-variant/40 px-6 py-5">
              <div className={richTextClasses} dangerouslySetInnerHTML={{ __html: announcement.body }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-card">
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-64 max-w-[60%]" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="size-5 shrink-0" />
    </div>
  );
}

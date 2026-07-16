import { motion } from "framer-motion";
import { BookmarkX, BookOpen, Compass, PlaySquare } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookmarks, useToggleBookmark } from "@/hooks/use-engagement";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Bookmark, BookmarkableType } from "@/types";

const PER_PAGE = 12;

type TypeFilter = BookmarkableType | "all";

const typeTabs: ReadonlyArray<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "course", label: "Courses" },
  { value: "lesson", label: "Lessons" },
];

export default function BookmarksPage() {
  const [type, setType] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);

  const bookmarksQuery = useBookmarks({
    page,
    per_page: PER_PAGE,
    type: type === "all" ? undefined : type,
  });

  const bookmarks = bookmarksQuery.data?.data ?? [];

  function handleTypeChange(value: string) {
    setType(value as TypeFilter);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Bookmarks"
        description="Courses and lessons you've saved to come back to."
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="mb-6"
      >
        <Tabs value={type} onValueChange={handleTypeChange}>
          <TabsList aria-label="Filter bookmarks by type">
            {typeTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      <motion.section
        aria-label="Bookmarks"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        {bookmarksQuery.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <BookmarkSkeleton key={index} />
            ))}
          </div>
        ) : bookmarksQuery.isError ? (
          <ErrorState
            title="Couldn't load your bookmarks"
            error={bookmarksQuery.error}
            onRetry={() => {
              void bookmarksQuery.refetch();
            }}
          />
        ) : bookmarks.length === 0 ? (
          <EmptyState
            icon={type === "lesson" ? PlaySquare : BookOpen}
            title={
              type === "all"
                ? "No bookmarks yet"
                : type === "course"
                  ? "No bookmarked courses"
                  : "No bookmarked lessons"
            }
            description="Tap the bookmark icon on any course or lesson to save it here for quick access."
            action={
              <Button variant="secondary" asChild>
                <Link to={paths.courses}>
                  <Compass className="size-4" aria-hidden="true" />
                  Browse courses
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <div
              className={cn(
                "grid gap-6 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200",
                bookmarksQuery.isPlaceholderData && bookmarksQuery.isFetching && "opacity-60",
              )}
            >
              {bookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.35), ease: "easeOut" }}
                >
                  <BookmarkCard bookmark={bookmark} />
                </motion.div>
              ))}
            </div>

            {bookmarksQuery.data && (
              <PaginationBar
                meta={bookmarksQuery.data.meta}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-8"
              />
            )}
          </>
        )}
      </motion.section>
    </div>
  );
}

function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
  const navigate = useNavigate();
  const toggleBookmark = useToggleBookmark();

  const target =
    bookmark.type === "course"
      ? paths.course(bookmark.course_id)
      : paths.lesson(bookmark.course_id, bookmark.bookmarkable_id);

  const Icon = bookmark.type === "course" ? BookOpen : PlaySquare;

  function handleRemove(event: MouseEvent) {
    event.stopPropagation();
    toggleBookmark.mutate(
      { type: bookmark.type, id: bookmark.bookmarkable_id, bookmarked: false },
      {
        onSuccess: () => toast.success("Removed from bookmarks"),
        onError: () => toast.error("Couldn't remove the bookmark. Please try again."),
      },
    );
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`Open ${bookmark.type}: ${bookmark.title}`}
      onClick={() => navigate(target)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(target);
        }
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden p-0 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="bg-gradient-brand relative aspect-video w-full overflow-hidden">
        {bookmark.thumbnail_url ? (
          <img src={bookmark.thumbnail_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon className="size-10 text-white/70" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge variant={bookmark.type === "course" ? "primary" : "secondary"}>
            {bookmark.type === "course" ? "Course" : "Lesson"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1.5 -mr-1.5 size-8 text-outline hover:text-error"
            onClick={handleRemove}
            disabled={toggleBookmark.isPending}
            aria-label={`Remove bookmark: ${bookmark.title}`}
          >
            <BookmarkX className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <h3 className="mt-3 line-clamp-2 font-display text-body-lg font-semibold text-on-surface group-hover:text-primary">
          {bookmark.title}
        </h3>
        {bookmark.subtitle && (
          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{bookmark.subtitle}</p>
        )}

        <p className="mt-auto pt-4 font-mono text-label-sm text-outline">
          Saved {formatRelative(bookmark.created_at)}
        </p>
      </div>
    </Card>
  );
}

function BookmarkSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-video w-full animate-pulse bg-surface-container" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </Card>
  );
}

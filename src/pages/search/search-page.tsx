import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  Megaphone,
  PlaySquare,
  Search,
  SearchX,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useSearch } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import { paths } from "@/routes/paths";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(query);

  // Debounce keystrokes into the URL param (the URL stays shareable).
  useEffect(() => {
    if (draft === query) return;
    const timer = setTimeout(() => {
      setSearchParams(draft.trim() ? { q: draft.trim() } : {}, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, query, setSearchParams]);

  const searchQuery = useSearch(query);
  const results = searchQuery.data;

  const totalResults = results
    ? results.courses.length +
      results.lessons.length +
      results.assignments.length +
      results.quizzes.length +
      results.announcements.length
    : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Discover"
        title="Search"
        description="Find courses, lessons, assignments, quizzes and announcements across MarkDev."
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="relative mb-6 max-w-2xl"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-outline"
          aria-hidden="true"
        />
        <Input
          type="search"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search MarkDev…"
          aria-label="Search MarkDev"
          className="h-12 pl-12 text-body-md shadow-card"
        />
        {searchQuery.isFetching && (
          <Spinner className="absolute top-1/2 right-4 size-4 -translate-y-1/2" />
        )}
      </motion.div>

      {query.trim().length < 2 ? (
        <EmptyState
          icon={Search}
          title="Search MarkDev"
          description="Type at least two characters to search your learning workspace."
        />
      ) : searchQuery.isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, index) => (
            <SectionSkeleton key={index} />
          ))}
        </div>
      ) : searchQuery.isError ? (
        <ErrorState
          title="Search failed"
          error={searchQuery.error}
          onRetry={() => {
            void searchQuery.refetch();
          }}
        />
      ) : !results || totalResults === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`No results for “${query}”`}
          description="Try different keywords, or check the spelling."
        />
      ) : (
        <div className="space-y-6">
          <ResultSection title="Courses" icon={BookOpen} count={results.courses.length}>
            {results.courses.map((course) => (
              <ResultRow key={`course-${course.id}`} to={paths.course(course.id)}>
                <ThumbTile icon={BookOpen} src={course.thumbnail_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md font-semibold text-on-surface">{course.title}</p>
                  {course.excerpt && (
                    <p className="mt-0.5 line-clamp-1 text-body-sm text-on-surface-variant">
                      {course.excerpt}
                    </p>
                  )}
                </div>
              </ResultRow>
            ))}
          </ResultSection>

          <ResultSection title="Lessons" icon={PlaySquare} count={results.lessons.length}>
            {results.lessons.map((lesson) => (
              <ResultRow key={`lesson-${lesson.id}`} to={paths.lesson(lesson.course_id, lesson.id)}>
                <ThumbTile icon={PlaySquare} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md font-semibold text-on-surface">{lesson.title}</p>
                  <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">
                    {lesson.course_title}
                  </p>
                </div>
              </ResultRow>
            ))}
          </ResultSection>

          <ResultSection title="Assignments" icon={ClipboardList} count={results.assignments.length}>
            {results.assignments.map((assignment) => (
              <ResultRow key={`assignment-${assignment.id}`} to={paths.assignment(assignment.id)}>
                <ThumbTile icon={ClipboardList} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md font-semibold text-on-surface">
                    {assignment.title}
                  </p>
                  <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">
                    {assignment.course_title}
                  </p>
                </div>
                {assignment.due_at && (
                  <span className="shrink-0 font-mono text-label-sm text-on-surface-variant">
                    Due {formatDate(assignment.due_at)}
                  </span>
                )}
              </ResultRow>
            ))}
          </ResultSection>

          <ResultSection title="Quizzes" icon={FileQuestion} count={results.quizzes.length}>
            {results.quizzes.map((quiz) => (
              <ResultRow key={`quiz-${quiz.id}`} to={paths.quiz(quiz.id)}>
                <ThumbTile icon={FileQuestion} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md font-semibold text-on-surface">{quiz.title}</p>
                  <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">
                    {quiz.course_title}
                  </p>
                </div>
              </ResultRow>
            ))}
          </ResultSection>

          <ResultSection title="Announcements" icon={Megaphone} count={results.announcements.length}>
            {results.announcements.map((announcement) => (
              <ResultRow key={`announcement-${announcement.id}`} to={paths.announcements}>
                <ThumbTile icon={Megaphone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md font-semibold text-on-surface">
                    {announcement.title}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-label-sm text-on-surface-variant">
                  {formatDate(announcement.published_at)}
                </span>
              </ResultRow>
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: LucideIcon;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-mono text-label-md text-on-surface uppercase">{title}</h2>
          <Badge variant="neutral">{count}</Badge>
        </div>
        <ul className="divide-y divide-outline-variant/40">{children}</ul>
      </Card>
    </motion.div>
  );
}

function ResultRow({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="-mx-3 flex items-center gap-4 rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-surface-ice"
      >
        {children}
      </Link>
    </li>
  );
}

function ThumbTile({ icon: Icon, src }: { icon: LucideIcon; src?: string | null }) {
  if (src) {
    return <img src={src} alt="" className="size-11 shrink-0 rounded-xl object-cover" />;
  }
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
      <Icon className="size-5 text-primary" aria-hidden="true" />
    </div>
  );
}

/** Extracted so the loading layout mirrors a real section. */
function SectionSkeleton() {
  return (
    <Card className="space-y-4 p-6">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="size-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Card>
  );
}

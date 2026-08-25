import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  Search,
  Video,
  CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useNotes,
  useMarkNoteRead,
} from "@/hooks/use-engagement";

import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Note } from "@/types";

/* -------------------------------------------------------
 * File type visual
 * ----------------------------------------------------- */

function fileVisual(fileType: string | null): {
  icon: LucideIcon;
  tile: string;
  iconColor: string;
} {
  const type = (fileType ?? "").toLowerCase();

  if (type === "pdf" || type === "application/pdf") {
    return {
      icon: FileText,
      tile: "bg-error/10",
      iconColor: "text-error",
    };
  }

  if (
    ["doc", "docx", "txt", "md", "application/msword"].includes(type)
  ) {
    return {
      icon: FileText,
      tile: "bg-secondary/10",
      iconColor: "text-secondary",
    };
  }

  if (["xls", "xlsx", "csv"].includes(type)) {
    return {
      icon: FileSpreadsheet,
      tile: "bg-success-container",
      iconColor: "text-success",
    };
  }

  if (["ppt", "pptx"].includes(type)) {
    return {
      icon: Presentation,
      tile: "bg-warning-container",
      iconColor: "text-warning",
    };
  }

  if (
    ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(type)
  ) {
    return {
      icon: FileImage,
      tile: "bg-primary/10",
      iconColor: "text-primary",
    };
  }

  if (["zip", "rar", "7z"].includes(type)) {
    return {
      icon: FileArchive,
      tile: "bg-on-surface-variant/10",
      iconColor: "text-on-surface-variant",
    };
  }

  if (["mp4", "mov", "webm", "mkv"].includes(type)) {
    return {
      icon: Video,
      tile: "bg-primary/10",
      iconColor: "text-primary",
    };
  }

  return {
    icon: File,
    tile: "bg-on-surface-variant/10",
    iconColor: "text-on-surface-variant",
  };
}

/* -------------------------------------------------------
 * Badge palette
 * ----------------------------------------------------- */

const BADGE_PALETTE = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-secondary/10", text: "text-secondary" },
  {
    bg: "bg-on-surface-variant/10",
    text: "text-on-surface-variant",
  },
  {
    bg: "bg-[#6B53C4]/10",
    text: "text-[#6B53C4]",
  },
];

function badgeStyle(courseIndex: number) {
  return BADGE_PALETTE[courseIndex % BADGE_PALETTE.length];
}

/* -------------------------------------------------------
 * Notes page
 * ----------------------------------------------------- */

export default function NotesPage() {
  const notesQuery = useNotes();
  const markNoteRead = useMarkNoteRead();

  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState<number | "all">("all");

  /*
   * IMPORTANT:
   * Mark the note as read, then open the actual file.
   */
  const handleOpenNote = (note: Note) => {
    /*
     * Record note activity in Laravel.
     *
     * We don't wait for this request because we don't want
     * the student to have to wait before opening the PDF.
     */
    markNoteRead.mutate(note.id);

    /*
     * Open the actual note file.
     */
    if (note.file_url) {
      window.open(
        note.file_url,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const notes = useMemo(
    () => notesQuery.data ?? [],
    [notesQuery.data],
  );

  /* -------------------------------------------------------
   * Build course filters
   * ----------------------------------------------------- */

  const courses = useMemo(() => {
    const seen = new Map<number, string>();

    for (const note of notes) {
      if (
        note.course?.id != null &&
        !seen.has(note.course.id)
      ) {
        seen.set(
          note.course.id,
          note.course.title ?? "Course",
        );
      }
    }

    return [...seen.entries()].map(([id, title]) => ({
      id,
      title,
    }));
  }, [notes]);

  const courseIndexById = useMemo(() => {
    const map = new Map<number, number>();

    courses.forEach((course, index) => {
      map.set(course.id, index);
    });

    return map;
  }, [courses]);

  /* -------------------------------------------------------
   * Search + course filtering
   * ----------------------------------------------------- */

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes.filter((note) => {
      if (
        courseId !== "all" &&
        note.course?.id !== courseId
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        note.title,
        note.description,
        note.course?.title,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [notes, search, courseId]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Learning"
          title="Study Materials"
          description="Access all your course notes, lecture slides, and supplementary materials in one organized place."
        />

        <div className="relative w-full md:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
          />

          <Input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search notes, courses..."
            aria-label="Search notes and courses"
            className="h-11 pl-10"
          />
        </div>
      </div>

      {/* Course filters */}
      {courses.length > 0 && (
        <div
          className="mb-8 flex w-full gap-3 overflow-x-auto border-b border-outline-variant/30 pb-3"
          role="group"
          aria-label="Filter notes by course"
        >
          <FilterChip
            active={courseId === "all"}
            onClick={() => setCourseId("all")}
          >
            All Courses
          </FilterChip>

          {courses.map((course) => (
            <FilterChip
              key={course.id}
              active={courseId === course.id}
              onClick={() =>
                setCourseId(course.id)
              }
            >
              {course.title}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Loading */}
      {notesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from(
            { length: 8 },
            (_, index) => (
              <Card
                key={index}
                className="rounded-2xl p-6"
              >
                <Skeleton className="mb-4 size-12 rounded-xl" />
                <Skeleton className="mb-3 h-6 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ),
          )}
        </div>
      ) : notesQuery.isError ? (
        <ErrorState
          title="Couldn't load your notes"
          error={notesQuery.error}
          onRetry={() => {
            void notesQuery.refetch();
          }}
        />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            notes.length === 0
              ? "No notes yet"
              : "Nothing matches your filters"
          }
          description={
            notes.length === 0
              ? "Course notes, lecture slides and supplementary materials will appear here."
              : "Try another search term or select All Courses."
          }
        />
      ) : (
        /* Notes grid */
        <div className="grid w-full grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.3,
                delay: Math.min(
                  index * 0.04,
                  0.3,
                ),
                ease: "easeOut",
              }}
            >
              <NoteCard
                note={note}
                courseIndex={
                  note.course?.id != null
                    ? (courseIndexById.get(
                        note.course.id,
                      ) ?? 0)
                    : 0
                }
                onOpen={handleOpenNote}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
 * Filter chip
 * ----------------------------------------------------- */

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 font-mono text-label-md transition-all active:scale-95",
        active
          ? "bg-primary text-white shadow-md"
          : "border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------
 * Note card
 * ----------------------------------------------------- */

function NoteCard({
  note,
  courseIndex,
  onOpen,
}: {
  note: Note;
  courseIndex: number;
  onOpen: (note: Note) => void;
}) {
  const {
    icon: Icon,
    tile,
    iconColor,
  } = fileVisual(note.file_type);

  const badge = badgeStyle(courseIndex);

  return (
    <Card
      className="
        group flex flex-col
        rounded-2xl
        border border-transparent
        bg-white p-5
        shadow-card
        transition-all duration-300
        hover:-translate-y-0.5
        hover:border-primary/20
        hover:shadow-elevated
        gap-0
      "
    >
      {/* Top */}
      <div className="mb-4 flex items-start justify-start gap-2">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            tile,
          )}
        >
          <Icon
            className={cn(
              "size-7",
              iconColor,
            )}
            aria-hidden="true"
          />
        </div>

        {note.course?.title ? (
          <Badge
            variant="secondary"
            className={cn(
              "max-w-[65%] shrink min-w-0 whitespace-normal break-words rounded-md px-2.5 py-1 text-center font-mono text-label-sm leading-tight",
              badge.bg,
              badge.text,
            )}
          >
            {note.course.title}
          </Badge>
        ) : null}
      </div>

      {/* Title */}
      <h3
        className="
          font-display text-headline-md font-semibold
          leading-snug
          text-on-surface
          line-clamp-2
          transition-colors
          group-hover:text-primary
        "
      >
        {note.title}
      </h3>

      {/* Description */}
      <p className="mt-2 mb-4 line-clamp-2 text-body-sm leading-relaxed text-on-surface-variant">
        {note.description ??
          "Course learning material"}
      </p>

      {/* Bottom */}
      <div className="flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-4">
        <span className="flex min-w-0 items-center gap-1 font-mono text-label-sm text-outline">
          <CalendarDays
            className="size-4 shrink-0"
            aria-hidden="true"
          />

          <span className="truncate">
            {note.uploaded_at
              ? formatDate(note.uploaded_at)
              : "—"}
          </span>
        </span>

        {note.file_url ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="
              size-8 shrink-0 rounded-full
              bg-surface-container-low
              text-primary
              hover:bg-primary
              hover:text-white
            "
            aria-label={`Download ${note.title}`}
            onClick={() => onOpen(note)}
          >
            <Download
              className="size-4"
              aria-hidden="true"
            />
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
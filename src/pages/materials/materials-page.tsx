import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpenCheck,
  CheckCircle2,
  Download,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Presentation,
  Search,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useMarkMaterialRead, useMaterials } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Material } from "@/types";

/** Icon + tile treatment per file extension family. */
function fileVisual(fileType: string | null): { icon: LucideIcon; tile: string } {
  const type = (fileType ?? "").toLowerCase();
  if (type === "pdf") return { icon: FileText, tile: "bg-error-container text-error" };
  if (["doc", "docx", "txt", "md"].includes(type)) return { icon: FileText, tile: "bg-primary/10 text-primary" };
  if (["xls", "xlsx", "csv"].includes(type)) return { icon: FileSpreadsheet, tile: "bg-success-container text-success" };
  if (["ppt", "pptx"].includes(type)) return { icon: Presentation, tile: "bg-warning-container text-warning" };
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(type)) return { icon: FileImage, tile: "bg-secondary/10 text-secondary" };
  if (["zip", "rar", "7z"].includes(type)) return { icon: FileArchive, tile: "bg-on-surface-variant/10 text-on-surface-variant" };
  if (["mp4", "mov", "webm", "mkv"].includes(type)) return { icon: Video, tile: "bg-primary/10 text-primary" };
  return { icon: File, tile: "bg-on-surface-variant/10 text-on-surface-variant" };
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default function MaterialsPage() {
  const materialsQuery = useMaterials();
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState<number | "all">("all");

  const materials = useMemo(() => materialsQuery.data ?? [], [materialsQuery.data]);

  const courses = useMemo(() => {
    const seen = new Map<number, string>();
    for (const material of materials) {
      if (material.course.id != null && !seen.has(material.course.id)) {
        seen.set(material.course.id, material.course.title ?? "Course");
      }
    }
    return [...seen.entries()].map(([id, title]) => ({ id, title }));
  }, [materials]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return materials.filter((material) => {
      if (courseId !== "all" && material.course.id !== courseId) return false;
      if (!query) return true;
      return [material.name, material.lesson.title, material.course.title]
        .filter(Boolean)
        .some((text) => (text as string).toLowerCase().includes(query));
    });
  }, [materials, search, courseId]);

  const readCount = materials.filter((material) => material.is_read).length;

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title="Study materials"
        description="Course notes, lecture slides and supplementary materials from your enrolled courses — mark them read as you study."
      />

      {/* Search + course filter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="mb-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-on-surface-variant"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes, courses…"
              aria-label="Search study materials"
              className="pl-9"
            />
          </div>
          {materials.length > 0 ? (
            <p className="font-mono text-label-sm text-on-surface-variant uppercase">
              {readCount}/{materials.length} read
            </p>
          ) : null}
        </div>

        {courses.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by course">
            <FilterChip active={courseId === "all"} onClick={() => setCourseId("all")}>
              All courses
            </FilterChip>
            {courses.map((course) => (
              <FilterChip
                key={course.id}
                active={courseId === course.id}
                onClick={() => setCourseId(course.id)}
              >
                {course.title}
              </FilterChip>
            ))}
          </div>
        ) : null}
      </motion.div>

      {materialsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Card key={index} className="gap-4 p-5">
              <Skeleton className="size-11 rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : materialsQuery.isError ? (
        <ErrorState
          title="Couldn't load your study materials"
          error={materialsQuery.error}
          onRetry={() => {
            void materialsQuery.refetch();
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={materials.length === 0 ? "No study materials yet" : "Nothing matches your filters"}
          description={
            materials.length === 0
              ? "Files your instructors attach to lessons — notes, slides, worksheets — will appear here."
              : "Try a different search term or switch back to all courses."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((material, index) => (
            <motion.li
              key={material.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
            >
              <MaterialCard material={material} />
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
        "rounded-full border px-3.5 py-1.5 font-mono text-label-sm transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-outline-variant/60 bg-white text-on-surface-variant hover:border-primary/40 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const markRead = useMarkMaterialRead();
  const { icon: Icon, tile } = fileVisual(material.file_type);

  const handleMarkRead = () => {
    if (material.is_read || markRead.isPending) return;
    markRead.mutate(material.id, {
      onSuccess: () => {
        toast.success(`"${material.name}" marked as read — it now counts toward your activity.`);
      },
      onError: () => {
        toast.error("Couldn't mark this as read. Please try again.");
      },
    });
  };

  return (
    <Card className="h-full gap-0 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tile)}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        {material.course.title ? (
          <Badge variant="secondary" className="max-w-36 truncate">
            {material.course.title}
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-4 line-clamp-2 font-display text-body-lg font-bold text-on-surface">
        {material.name}
      </h3>
      <p className="mt-1 truncate text-body-sm text-on-surface-variant">
        {material.lesson.title ?? "Lesson"}
        {material.size_bytes > 0 ? ` · ${formatSize(material.size_bytes)}` : ""}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-outline-variant/40 pt-3.5">
        <p className="font-mono text-label-sm text-on-surface-variant">
          {material.uploaded_at ? formatDate(material.uploaded_at) : "—"}
        </p>
        <div className="flex items-center gap-1.5">
          {material.file_url ? (
            <Button asChild size="icon" variant="ghost" className="size-8" aria-label={`Download ${material.name}`}>
              <a href={material.file_url} download target="_blank" rel="noreferrer">
                <Download aria-hidden="true" />
              </a>
            </Button>
          ) : null}
          {material.is_read ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-2.5 py-1 font-mono text-label-sm text-on-success-container">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Read
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkRead}
              disabled={markRead.isPending}
            >
              {markRead.isPending ? (
                <Spinner aria-hidden="true" />
              ) : (
                <BookOpenCheck aria-hidden="true" />
              )}
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileQuestion,
  FileText,
  FolderDown,
  Lock,
  Play,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { LessonSummary, LessonType, Module } from "@/types";

const lessonTypeIcons: Record<LessonType, LucideIcon> = {
  video: Play,
  article: FileText,
  quiz: FileQuestion,
  assignment: ClipboardList,
  resource: FolderDown,
};

const lessonTypeLabels: Record<LessonType, string> = {
  video: "Video",
  article: "Article",
  quiz: "Quiz",
  assignment: "Assignment",
  resource: "Resource",
};

interface CurriculumAccordionProps {
  modules: Module[];
  courseId: number | string;
  isEnrolled: boolean;
}

/**
 * Keyboard-accessible disclosure list of course modules. Headers are native
 * buttons (Enter/Space work for free); panels animate open with a
 * framer-motion height transition.
 */
export function CurriculumAccordion({ modules, courseId, isEnrolled }: CurriculumAccordionProps) {
  const sortedModules = [...modules].sort((a, b) => a.position - b.position);
  const [openIds, setOpenIds] = useState<ReadonlySet<number>>(() => {
    const first = sortedModules[0];
    return new Set(first ? [first.id] : []);
  });

  const toggle = (moduleId: number) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {sortedModules.map((module) => (
        <ModuleDisclosure
          key={module.id}
          module={module}
          courseId={courseId}
          isEnrolled={isEnrolled}
          isOpen={openIds.has(module.id)}
          onToggle={() => toggle(module.id)}
        />
      ))}
    </div>
  );
}

interface ModuleDisclosureProps {
  module: Module;
  courseId: number | string;
  isEnrolled: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function ModuleDisclosure({ module, courseId, isEnrolled, isOpen, onToggle }: ModuleDisclosureProps) {
  const panelId = `module-panel-${module.id}`;
  const headerId = `module-header-${module.id}`;
  const sortedLessons = [...module.lessons].sort((a, b) => a.position - b.position);

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-white">
      <h3 className="m-0">
        <button
          type="button"
          id={headerId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors duration-150 hover:bg-surface-ice sm:px-5"
        >
          <span className="font-mono text-label-md text-primary" aria-hidden="true">
            {String(module.position).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 font-display text-body-md font-semibold text-on-surface">
            {module.title}
          </span>
          <span className="hidden shrink-0 font-mono text-label-sm text-on-surface-variant sm:inline">
            {module.lessons_count} {module.lessons_count === 1 ? "lesson" : "lessons"} ·{" "}
            {formatDuration(module.duration_minutes)}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-on-surface-variant transition-transform duration-200",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {sortedLessons.length === 0 ? (
              <p className="border-t border-outline-variant/40 px-5 py-4 text-body-sm text-on-surface-variant">
                No lessons in this module yet.
              </p>
            ) : (
              <ul className="space-y-1 border-t border-outline-variant/40 p-2">
                {sortedLessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    courseId={courseId}
                    isEnrolled={isEnrolled}
                  />
                ))}
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface LessonRowProps {
  lesson: LessonSummary;
  courseId: number | string;
  isEnrolled: boolean;
}

function LessonRow({ lesson, courseId, isEnrolled }: LessonRowProps) {
  const locked = !isEnrolled && !lesson.is_preview;
  const Icon = lessonTypeIcons[lesson.type];

  const content = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          lesson.is_completed ? "bg-success-container text-success" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-medium text-on-surface">
          {lesson.title}
        </span>
        <span className="mt-0.5 block font-mono text-label-sm text-on-surface-variant">
          {lessonTypeLabels[lesson.type]} · {formatDuration(lesson.duration_minutes)}
        </span>
      </span>
      {lesson.is_preview ? <Badge variant="secondary">Preview</Badge> : null}
      {lesson.is_completed ? (
        <CheckCircle2 className="size-5 shrink-0 text-success" role="img" aria-label="Completed" />
      ) : locked ? (
        <Lock className="size-4 shrink-0 text-outline" role="img" aria-label="Locked" />
      ) : (
        <span className="size-5 shrink-0" aria-hidden="true" />
      )}
    </>
  );

  if (locked) {
    return (
      <li>
        <div
          aria-disabled="true"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 opacity-55"
        >
          {content}
          <span className="sr-only">Enroll in this course to unlock this lesson</span>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={paths.lesson(courseId, lesson.id)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-surface-ice"
      >
        {content}
      </Link>
    </li>
  );
}

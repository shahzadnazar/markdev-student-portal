import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Clock,
  Download,
  FileQuestion,
  FileText,
  FolderDown,
  PlayCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatClock, formatDuration } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { Lesson, Resource } from "@/types";
import { VideoPlayer } from "./video-player";
import type { PlaybackSample } from "./video-player";

/** Styled wrapper for rich-text HTML coming from the API. */
const richTextClass =
  "space-y-4 text-body-md text-on-surface [&_a]:text-primary [&_a]:underline [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-xl [&_pre]:bg-inverse-surface [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-body-sm [&_pre]:text-inverse-on-surface [&_pre]:overflow-x-auto [&_code]:font-mono";

interface ActivityCtaCardProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action: { label: string; to: string } | null;
  fallback: string;
}

function ActivityCtaCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  fallback,
}: ActivityCtaCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-10 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-elevated">
          <Icon className="size-8 text-on-primary" aria-hidden="true" />
        </div>
        <p className="font-mono text-label-sm text-primary uppercase">{eyebrow}</p>
        <h2 className="mt-2 font-display text-headline-md text-on-surface">{title}</h2>
        <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{description}</p>
        {action ? (
          <Button size="lg" asChild className="mt-6">
            <Link to={action.to}>{action.label}</Link>
          </Button>
        ) : (
          <p className="mt-6 font-mono text-label-sm text-outline uppercase">{fallback}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** The primary lesson body, switched on `lesson.type`. */
export function LessonContent({
  lesson,
  onSample,
  onPause,
}: {
  lesson: Lesson;
  onSample?: (sample: PlaybackSample) => void;
  onPause?: () => void;
}) {
  switch (lesson.type) {
    case "video":
      if (!lesson.video) {
        return (
          <EmptyState
            icon={PlayCircle}
            title="Video not available yet"
            description="The instructor hasn't published the video for this lesson. Check back soon."
          />
        );
      }
      return (
        <VideoPlayer
          video={lesson.video}
          title={lesson.title}
          onSample={onSample}
          onPause={onPause}
        />
      );

    case "article":
      if (!lesson.content) {
        return (
          <EmptyState
            icon={FileText}
            title="Nothing to read yet"
            description="This article hasn't been published. Check back soon."
          />
        );
      }
      return (
        <Card>
          <CardContent>
            <div className={richTextClass} dangerouslySetInnerHTML={{ __html: lesson.content }} />
          </CardContent>
        </Card>
      );

    case "quiz":
      return (
        <ActivityCtaCard
          icon={FileQuestion}
          eyebrow="Knowledge check"
          title="Ready to test yourself?"
          description="This lesson is a quiz. Review the material, then take the quiz to check your understanding and earn progress."
          action={
            lesson.quiz_id != null ? { label: "Open quiz", to: paths.quiz(lesson.quiz_id) } : null
          }
          fallback="Quiz not available yet"
        />
      );

    case "assignment":
      return (
        <ActivityCtaCard
          icon={ClipboardList}
          eyebrow="Hands-on practice"
          title="Time to build something"
          description="This lesson is an assignment. Read the brief, complete the work and submit it for feedback from your instructor."
          action={
            lesson.assignment_id != null
              ? { label: "Open assignment", to: paths.assignment(lesson.assignment_id) }
              : null
          }
          fallback="Assignment not available yet"
        />
      );

    case "resource":
      return (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <FolderDown className="size-8 text-primary" aria-hidden="true" />
            </div>
            <p className="font-mono text-label-sm text-primary uppercase">Downloadable materials</p>
            <h2 className="mt-2 font-display text-headline-md text-on-surface">{lesson.title}</h2>
            <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
              {lesson.resources.length > 0
                ? "Grab the files below — everything you need for this lesson is in the resources list."
                : "No files have been attached to this lesson yet. Check back soon."}
            </p>
          </CardContent>
        </Card>
      );
  }
}

/** Compact meta strip — lesson type, duration (mono) and preview flag. */
export function LessonMetaCard({ lesson }: { lesson: Lesson }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-label-sm text-primary uppercase">About this lesson</p>
          <h2 className="mt-1 truncate font-display text-body-lg font-semibold text-on-surface">
            {lesson.title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="primary">{lesson.type}</Badge>
          {lesson.is_preview ? <Badge variant="secondary">Preview</Badge> : null}
          <span className="inline-flex items-center gap-1.5 font-mono text-label-sm text-on-surface-variant uppercase">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatDuration(lesson.duration_minutes)}
          </span>
          {lesson.video ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-label-sm text-on-surface-variant uppercase">
              <PlayCircle className="size-3.5" aria-hidden="true" />
              {formatClock(lesson.video.duration_seconds)}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

/** Attached files with type, size and a download action. Render only when non-empty. */
export function ResourcesCard({ resources }: { resources: Resource[] }) {
  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Resources</p>
        <CardTitle className="text-body-lg font-semibold">
          {resources.length} {resources.length === 1 ? "file" : "files"} attached
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-outline-variant/40">
          {resources.map((resource) => (
            <li key={resource.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-on-surface">{resource.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="neutral">{resource.file_type}</Badge>
                  <span className="font-mono text-label-sm text-outline">
                    {formatBytes(resource.size_bytes)}
                  </span>
                </div>
              </div>
              <Button variant="secondary" size="sm" asChild className="shrink-0">
                <a
                  href={resource.file_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Download ${resource.name}`}
                >
                  <Download aria-hidden="true" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatDuration, formatPercent, formatRelative } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { CourseProgress } from "@/types";

function isCourseCompleted(item: CourseProgress): boolean {
  return item.completed_at !== null && item.progress_percent >= 100;
}

function CourseThumb({ item }: { item: CourseProgress }) {
  if (item.course.thumbnail_url) {
    return (
      <img
        src={item.course.thumbnail_url}
        alt=""
        aria-hidden="true"
        className="h-32 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-32"
      />
    );
  }
  return (
    <div
      className="flex h-32 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-brand sm:h-20 sm:w-32"
      aria-hidden="true"
    >
      <BookOpen className="size-7 text-white/90" />
    </div>
  );
}

interface CourseProgressRowProps {
  item: CourseProgress;
  index: number;
}

function CourseProgressRow({ item, index }: CourseProgressRowProps) {
  const completed = isCourseCompleted(item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card className="flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated sm:flex-row sm:items-center sm:gap-5">
        <CourseThumb item={item} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-body-lg font-semibold">
            <Link
              to={paths.course(item.course.id)}
              className="text-on-surface transition-colors duration-150 hover:text-primary"
            >
              {item.course.title}
            </Link>
          </h3>

          {completed ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-body-sm font-medium text-success">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              Completed {formatDate(item.completed_at)}
            </p>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <Progress
                value={item.progress_percent}
                className="flex-1"
                aria-label={`${item.course.title} progress`}
              />
              <span className="shrink-0 font-mono text-label-sm text-on-surface">
                {formatPercent(item.progress_percent)}
              </span>
            </div>
          )}

          <ProgressBreakdown item={item} />

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-label-sm text-on-surface-variant">
            <span>
              {item.completed_lessons}/{item.total_lessons} lessons
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDuration(item.time_spent_minutes)} spent</span>
            {item.last_activity_at ? (
              <>
                <span aria-hidden="true">·</span>
                <span>active {formatRelative(item.last_activity_at)}</span>
              </>
            ) : null}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

interface CourseGroupProps {
  eyebrow: string;
  title: string;
  headingId: string;
  items: CourseProgress[];
  emptyState: ReactNode;
}

function CourseGroup({ eyebrow, title, headingId, items, emptyState }: CourseGroupProps) {
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4">
        <p className="mb-1 font-mono text-label-sm text-primary uppercase">{eyebrow}</p>
        <div className="flex items-center gap-3">
          <h2 id={headingId} className="font-display text-headline-md text-on-surface">
            {title}
          </h2>
          <Badge variant="neutral">{items.length}</Badge>
        </div>
      </div>

      {items.length === 0 ? (
        emptyState
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <CourseProgressRow key={item.course.id} item={item} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}

interface CourseProgressGroupsProps {
  courses: CourseProgress[];
}

/** "Courses" — enrolled courses split into in-progress and completed groups. */
export function CourseProgressGroups({ courses }: CourseProgressGroupsProps) {
  const inProgress = courses
  .filter((item) => !isCourseCompleted(item))
  .slice(0, 1);
  const completed = courses.filter(isCourseCompleted);

  return (
    <div className="space-y-10">
      <CourseGroup
        eyebrow="Keep going"
        title="In progress"
        headingId="in-progress-heading"
        items={inProgress}
        emptyState={
          <EmptyState
            icon={BookOpen}
            title="Nothing in progress"
            description="Enroll in a course and every lesson, minute and milestone will be tracked here."
            action={
              <Button asChild>
                <Link to={paths.courses}>Browse courses</Link>
              </Button>
            }
          />
        }
      />

      <CourseGroup
        eyebrow="Well earned"
        title="Completed"
        headingId="completed-heading"
        items={completed}
        emptyState={
          <EmptyState
            icon={Trophy}
            title="No completed courses yet"
            description="Finish every lesson in a course and it will be celebrated here."
          />
        }
      />
    </div>
  );
}

/**
 * What the percentage is made of — never one opaque number.
 *
 * Each row is a component the admin ticked: what the student scored, what it is
 * worth, and what that contributed. The contributions use the EFFECTIVE weight,
 * so they add up to the total shown above even when a component has been
 * excluded and its share redistributed.
 *
 * A component the admin unticked is not here at all — the API omits it rather
 * than sending a row worth nothing. A component excluded because the COURSE has
 * no such data says so in words, because silently vanishing would look like a
 * page that failed to load.
 */
function ProgressBreakdown({ item }: { item: CourseProgress }) {
  if (item.breakdown.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl bg-surface-ice/60 p-3">
      <table className="w-full font-mono text-label-sm">
        <caption className="sr-only">
          How {item.course.title} progress is calculated
        </caption>
        <tbody>
          {item.breakdown.map((part) => (
            <tr key={part.key} className="align-baseline">
              <th scope="row" className="py-0.5 pr-2 text-left font-medium text-on-surface-variant">
                {part.label}
              </th>

              {part.excluded ? (
                <td colSpan={3} className="py-0.5 text-on-surface-variant">
                  Not set on this course — its share goes to the others
                </td>
              ) : (
                <>
                  <td className="py-0.5 pr-2 text-right tabular-nums text-on-surface">
                    {formatPercent(part.score ?? 0)}
                  </td>
                  <td className="py-0.5 pr-2 text-right tabular-nums text-outline">
                    ×{Math.round(part.effective_weight)}
                  </td>
                  <td className="py-0.5 text-right tabular-nums text-on-surface">
                    {part.contribution.toFixed(1)}
                  </td>
                </>
              )}
            </tr>
          ))}

          <tr className="border-t border-outline-variant/40">
            <th scope="row" className="pt-1.5 pr-2 text-left font-semibold text-on-surface">
              Total
            </th>
            <td colSpan={2} />
            <td className="pt-1.5 text-right font-semibold tabular-nums text-on-surface">
              {formatPercent(item.progress_percent)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

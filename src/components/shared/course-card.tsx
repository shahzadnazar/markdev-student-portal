import { BookOpen, Clock, Star, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatCompact, formatDuration } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { Course } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const levelLabels: Record<Course["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CourseCard({ course }: { course: Course }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Link
        to={paths.course(course.id)}
        className="block h-full rounded-2xl"
        aria-label={`Open course: ${course.title}`}
      >
        <Card className="flex h-full flex-col overflow-hidden p-0 transition-shadow duration-200 hover:shadow-elevated">
          {/* Thumbnail */}
          <div className="bg-gradient-brand relative aspect-video w-full overflow-hidden">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <BookOpen className="size-10 text-white/70" aria-hidden="true" />
              </div>
            )}
            {course.is_enrolled && course.enrollment && (
              <div className="absolute right-0 bottom-0 left-0 bg-black/35 px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Progress
                    value={course.enrollment.progress_percent}
                    className="h-1.5 flex-1 bg-white/25"
                    aria-label="Course progress"
                  />
                  <span className="font-mono text-label-sm text-white">
                    {Math.round(course.enrollment.progress_percent)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {course.category && <Badge variant="primary">{course.category.name}</Badge>}
              <Badge variant="neutral">{levelLabels[course.level]}</Badge>
              {course.is_free && <Badge variant="success">Free</Badge>}
            </div>

            <h3 className="line-clamp-2 font-display text-body-lg font-semibold text-on-surface">
              {course.title}
            </h3>
            {course.excerpt && (
              <p className="mt-1.5 line-clamp-2 text-body-sm text-on-surface-variant">{course.excerpt}</p>
            )}

            {course.instructor && (
              <p className="mt-3 text-body-sm text-on-surface-variant">
                By <span className="font-medium text-on-surface">{course.instructor.name}</span>
              </p>
            )}

            <div className="mt-auto flex items-center gap-4 pt-4 text-on-surface-variant">
              <span className="flex items-center gap-1.5 font-mono text-label-sm">
                <Clock className="size-3.5" aria-hidden="true" />
                {course.duration_label ?? formatDuration(course.duration_minutes)}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-label-sm">
                <BookOpen className="size-3.5" aria-hidden="true" />
                {course.lessons_count} lessons
              </span>
              <span className="ml-auto flex items-center gap-3">
                {course.rating != null && (
                  <span className="flex items-center gap-1 font-mono text-label-sm">
                    <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                    {course.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono text-label-sm">
                  <Users className="size-3.5" aria-hidden="true" />
                  {formatCompact(course.students_count)}
                </span>
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-video w-full animate-pulse bg-surface-container" />
      <div className="space-y-3 p-6">
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-5 w-5/6 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-4 w-2/3 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-surface-container" />
      </div>
    </Card>
  );
}

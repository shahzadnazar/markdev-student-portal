import type { ListParams } from "./api";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  courses_count?: number;
}

export interface InstructorSummary {
  id: number;
  name: string;
  avatar_url: string | null;
  headline: string | null;
  bio?: string | null;
  courses_count?: number;
  students_count?: number;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  thumbnail_url: string | null;
  level: CourseLevel;
  category: Category | null;
  instructor: InstructorSummary | null;
  tags: string[];
  duration_minutes: number;
  /** Human program length set by the academy, e.g. "3 months". */
  duration_label: string | null;
  modules_count: number;
  lessons_count: number;
  students_count: number;
  rating: number | null;
  is_free: boolean;
  price: number | null;
  /** Present on authenticated catalog responses. */
  is_enrolled: boolean;
  is_bookmarked: boolean;
  enrollment: Enrollment | null;
  published_at: string | null;
  updated_at: string;
}

export interface CourseListParams extends ListParams {
  category?: string;
  level?: CourseLevel;
  enrolled?: boolean;
}

export interface Enrollment {
  id: number;
  course_id: number;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  last_activity_at: string | null;
}

export type LessonType = "video" | "article" | "quiz" | "assignment" | "resource";

export interface Module {
  id: number;
  course_id: number;
  title: string;
  position: number;
  duration_minutes: number;
  lessons_count: number;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: number;
  module_id: number;
  course_id: number;
  title: string;
  type: LessonType;
  duration_minutes: number;
  position: number;
  is_preview: boolean;
  /** Present when the requester is enrolled. */
  is_completed: boolean;
}

export interface Lesson extends LessonSummary {
  /** Rich-text/HTML body for article lessons. */
  content: string | null;
  video: Video | null;
  resources: Resource[];
  /** Ids for the linked activity when type is quiz/assignment. */
  quiz_id: number | null;
  assignment_id: number | null;
  previous_lesson_id: number | null;
  next_lesson_id: number | null;
  is_bookmarked: boolean;
}

export interface Video {
  id: number;
  lesson_id: number;
  provider: "youtube" | "vimeo" | "self_hosted";
  /** Canonical watch URL (or file URL for self_hosted). */
  url: string;
  /** Iframe-ready URL for youtube/vimeo. */
  embed_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  captions_url: string | null;
}

export interface Resource {
  id: number;
  name: string;
  file_url: string;
  file_type: string;
  size_bytes: number | null;
}

export interface Comment {
  id: number;
  lesson_id: number;
  parent_id: number | null;
  body: string;
  author: { id: number; name: string; avatar_url: string | null };
  created_at: string;
  replies?: Comment[];
}

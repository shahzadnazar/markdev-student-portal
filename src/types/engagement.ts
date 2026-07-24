import type { ListParams } from "./api";
import type { CourseRef } from "./assessments";

/* ------------------------------- Attendance ------------------------------- */

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: number;
  date: string;
  status: AttendanceStatus;
  course: CourseRef | null;
  session_title: string | null;
  notes: string | null;
}

export interface AttendanceSummary {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  /** Percentage 0–100. */
  attendance_rate: number;
}

export type DailyAttendanceStatus = "present" | "late" | "absent" | "leave";

/** One row of the academy's daily register (front desk or biometric). */
export interface DailyAttendanceRecord {
  id: number;
  date: string;
  status: DailyAttendanceStatus;
  remarks: string | null;
  source: "manual" | "biometric";
  marked_at: string | null;
  /** True when staff corrected the record after marking. */
  corrected: boolean;
}

export interface DailyAttendancePage {
  data: DailyAttendanceRecord[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AttendanceParams extends ListParams {
  course_id?: number;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
}

/* ------------------------------ Certificates ------------------------------ */

export interface Certificate {
  id: number;
  certificate_number: string;
  course: CourseRef;
  issued_at: string;
  download_url: string;
  preview_url: string | null;
}

/* -------------------------------- Progress -------------------------------- */

export interface CourseProgress {
  course: CourseRef;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  time_spent_minutes: number;
  last_activity_at: string | null;
  completed_at: string | null;
}

export interface ProgressOverview {
  enrolled_courses: number;
  completed_courses: number;
  completed_lessons: number;
  total_time_minutes: number;
  current_streak_days: number;
  longest_streak_days: number;
  points: number;
  /** Daily learning minutes for the trailing 12 weeks. */
  activity: { date: string; minutes: number }[];
  courses: CourseProgress[];
}

/* ------------------------------- Leaderboard ------------------------------ */

export interface LeaderboardEntry {
  rank: number;
  user: { id: number; name: string; avatar_url: string | null };
  points: number;
  courses_completed: number;
  streak_days: number;
  is_me: boolean;
}

export interface Leaderboard {
  period: "weekly" | "monthly" | "all_time";
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

/* ------------------------------ Announcements ----------------------------- */

export interface Announcement {
  id: number;
  title: string;
  body: string;
  author: { id: number; name: string; avatar_url: string | null };
  course: CourseRef | null;
  is_pinned: boolean;
  is_read: boolean;
  published_at: string;
}

/* ------------------------------ Notifications ----------------------------- */

export interface AppNotification {
  /** Laravel notification UUID. */
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    /** In-app path to navigate to, e.g. "/assignments/4". */
    action_url: string | null;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationCounts {
  unread: number;
}

/* -------------------------------- Bookmarks ------------------------------- */

export type BookmarkableType = "course" | "lesson";

export interface Bookmark {
  id: number;
  type: BookmarkableType;
  /** Id of the bookmarked course/lesson. */
  bookmarkable_id: number;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  /** Course id the lesson belongs to (equals bookmarkable_id for courses). */
  course_id: number;
  created_at: string;
}

/* -------------------------------- Calendar -------------------------------- */

export type CalendarEventType = "assignment" | "quiz" | "live_session" | "announcement" | "other";

export interface CalendarEvent {
  id: number;
  title: string;
  type: CalendarEventType;
  starts_at: string;
  ends_at: string | null;
  course: CourseRef | null;
  /** In-app path, e.g. "/assignments/4". */
  action_url: string | null;
}

/* -------------------------------- Dashboard ------------------------------- */

export interface DashboardData {
  stats: {
    enrolled_courses: number;
    completed_courses: number;
    completed_lessons: number;
    hours_learned: number;
    pending_assignments: number;
    pending_quizzes: number;
    certificates_earned: number;
    current_streak_days: number;
    attendance_rate: number;
    points: number;
  };
  continue_learning: CourseProgress[];
  upcoming: CalendarEvent[];
  recent_announcements: Announcement[];
  /** Daily learning minutes for the trailing 4 weeks. */
  activity: { date: string; minutes: number }[];
}

/* ------------------------------- Help Center ------------------------------ */

export interface HelpCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  articles_count: number;
}

export interface HelpArticle {
  id: number;
  category: { id: number; name: string; slug: string } | null;
  title: string;
  slug: string;
  excerpt: string | null;
  /** Rich-text/HTML body, present on the detail endpoint. */
  body: string | null;
  updated_at: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
}

/* -------------------------------- Settings -------------------------------- */

export interface NotificationPreferences {
  email_announcements: boolean;
  email_assignment_graded: boolean;
  email_due_reminders: boolean;
  email_new_content: boolean;
  push_announcements: boolean;
  push_due_reminders: boolean;
}

export interface UserSettings {
  timezone: string;
  language: string;
  notifications: NotificationPreferences;
}

/* --------------------------------- Search --------------------------------- */

export interface SearchResults {
  courses: { id: number; title: string; slug: string; thumbnail_url: string | null; excerpt: string | null }[];
  lessons: { id: number; course_id: number; title: string; course_title: string }[];
  assignments: { id: number; title: string; course_title: string; due_at: string | null }[];
  quizzes: { id: number; title: string; course_title: string }[];
  announcements: { id: number; title: string; published_at: string }[];
}

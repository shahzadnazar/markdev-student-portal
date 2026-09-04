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
  /** Days covered by an approved leave application. */
  leave_count: number;
  /** Percentage 0–100. */
  attendance_rate: number;
}

export type DailyAttendanceStatus = "present" | "late" | "absent" | "leave";

/**
 * One day of the student's attendance.
 *
 * Merged server-side from the day register and the per-class records, which
 * only partly overlap, so the id is the date rather than either table's key.
 */
export interface DailyAttendanceRecord {
  id: string;
  date: string;
  status: DailyAttendanceStatus;
  remarks: string | null;
  /** Actual arrival time (HH:MM, 24h) — filled by the biometric device or front desk. */
  arrived_at: string | null;
  source: "manual" | "biometric";
  marked_at: string | null;
  /** True when staff corrected the record after marking. */
  corrected: boolean;
  /** The class session held that day, when there was one. */
  session_title: string | null;
  course: CourseRef | null;
}

export interface DailyAttendanceParams extends ListParams {
  from?: string;
  to?: string;
  status?: DailyAttendanceStatus;
}

export interface DailyAttendancePage {
  data: DailyAttendanceRecord[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
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

export interface ProgressPoint {
  month: string;
  lessons: number;
  quizzes: number;
  assignments: number;
  attendance: number;
  notes: number;
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

  /** Weekly learning progress by activity type. */
  progress: ProgressPoint[];

  courses: CourseProgress[];
}
/* --------------------------------- Notes --------------------------------- */

export interface Note {
  id: number;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  size_bytes: number;
  uploaded_at: string | null;
  is_read: boolean;

  course: {
    id: number;
    title: string;
  };

  instructor?: {
    id: number;
    name: string;
  };
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

/** An announcement still inside its 24-hour live window. */
export interface LiveAnnouncement {
  id: number;
  title: string;
  body: string;
  author: { id: number | null; name: string | null };
  course: { id: number; title: string } | null;
  published_at: string;
  /** When it stops being surfaced. */
  live_until: string;
}

/**
 * Split by how each one surfaces: staff announcements run across the top bar,
 * an instructor's arrive as a popup for their own students.
 */
export interface LiveAnnouncements {
  ticker: LiveAnnouncement[];
  popup: LiveAnnouncement[];
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
    /** True when an approved leave covers today. */
    approved_leave_today?: boolean;
    pending_leaves?: number;
    /** Notes published to the courses this student is enrolled in. */
    notes_available?: number;
  };
  continue_learning: CourseProgress[];
  upcoming: CalendarEvent[];
  recent_announcements: Announcement[];
  /** Daily learning minutes for the trailing 4 weeks. */
  activity: { date: string; minutes: number }[];
  /** Monthly learning progress by activity type, same series as /progress. */
  progress: ProgressPoint[];
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

/* ---------------------------- Leave applications --------------------------- */

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveApplication {
  id: number;
  from_date: string;
  to_date: string;
  days_count: number;
  reason: string;
  status: LeaveStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ApplyLeavePayload {
  from_date: string;
  to_date: string;
  reason: string;
}


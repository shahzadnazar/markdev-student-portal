import { destroy, get, getRaw, patch, post, put } from "@/api/client";
import type {
  Announcement,
  AppNotification,
  AttendanceParams,
  AttendanceRecord,
  AttendanceSummary,
  Bookmark,
  ApplyLeavePayload,
  LeaveApplication,
  LeaveApplicationPage,
  BookmarkableType,
  CalendarEvent,
  Certificate,
  DashboardData,
  Faq,
  HelpArticle,
  HelpCategory,
  Leaderboard,
  ListParams,
  NotificationCounts,
  Paginated,
  ProgressOverview,
  SearchResults,
  UserSettings,
  DailyAttendancePage,
  DailyAttendanceParams,
   Note,
  LiveAnnouncements,
} from "@/types";

export const dashboardRepository = {
  get() {
    return get<DashboardData>("/dashboard");
  },
};


export const attendanceRepository = {
  list(params: AttendanceParams = {}) {
    return getRaw<Paginated<AttendanceRecord>>("/attendance", { params });
  },

  summary(params: Pick<AttendanceParams, "course_id" | "from" | "to"> = {}) {
    return get<AttendanceSummary>("/attendance/summary", { params });
  },

  daily(params: DailyAttendanceParams = {}) {
    return getRaw<DailyAttendancePage>("/attendance/daily", { params });
  },
};

export const certificatesRepository = {
  list() {
    return get<Certificate[]>("/certificates");
  },
};

export const progressRepository = {
  overview() {
    return get<ProgressOverview>("/progress");
  },
};


export const leaderboardRepository = {
  get(period: Leaderboard["period"] = "weekly") {
    return get<Leaderboard>("/leaderboard", { params: { period } });
  },
};

export const announcementsRepository = {
  list(params: ListParams & { course_id?: number } = {}) {
    return getRaw<Paginated<Announcement>>("/announcements", { params });
  },

  get(announcementId: number | string) {
    return get<Announcement>(`/announcements/${announcementId}`);
  },

  markRead(announcementId: number | string) {
    return post<void>(`/announcements/${announcementId}/read`);
  },

  /** Announcements to surface right now — ticker and popup. */
  live() {
    return get<LiveAnnouncements>("/announcements/live");
  },
};

export const notificationsRepository = {
  list(params: ListParams & { unread?: boolean } = {}) {
    return getRaw<Paginated<AppNotification>>("/notifications", { params });
  },

  counts() {
    return get<NotificationCounts>("/notifications/counts");
  },

  markRead(notificationId: string) {
    return patch<void>(`/notifications/${notificationId}/read`);
  },

  markAllRead() {
    return post<void>("/notifications/read-all");
  },

  remove(notificationId: string) {
    return destroy(`/notifications/${notificationId}`);
  },
};

export const bookmarksRepository = {
  list(params: ListParams & { type?: BookmarkableType } = {}) {
    return getRaw<Paginated<Bookmark>>("/bookmarks", { params });
  },

  add(type: BookmarkableType, id: number) {
    return post<Bookmark>("/bookmarks", { type, id });
  },

  /** Removing is by target (type + id) so callers don't need the bookmark id. */
  remove(type: BookmarkableType, id: number) {
    return destroy(`/bookmarks/${type}/${id}`);
  },
};

export const leavesRepository = {
  list(params: ListParams = {}) {
    return getRaw<Paginated<LeaveApplication> & LeaveApplicationPage>("/leaves", { params });
  },

  apply(payload: ApplyLeavePayload) {
    return post<LeaveApplication>("/leaves", payload);
  },
};

export const calendarRepository = {
  events(from: string, to: string) {
    return get<CalendarEvent[]>("/calendar", { params: { from, to } });
  },
};

export const searchRepository = {
  search(query: string) {
    return get<SearchResults>("/search", { params: { q: query } });
  },
};

export const helpRepository = {
  categories() {
    return get<HelpCategory[]>("/help/categories");
  },

  articles(params: ListParams & { category?: string } = {}) {
    return getRaw<Paginated<HelpArticle>>("/help/articles", { params });
  },

  article(slug: string) {
    return get<HelpArticle>(`/help/articles/${slug}`);
  },

  faqs() {
    return get<Faq[]>("/help/faqs");
  },
};

export const settingsRepository = {
  get() {
    return get<UserSettings>("/settings");
  },

  update(payload: Partial<UserSettings>) {
    return put<UserSettings>("/settings", payload);
  },
};
export const lessonActivityRepository = {
  track(courseId: string | number, lessonId: string | number, minutes: number) {
    return post<void>(
      `/courses/${courseId}/lessons/${lessonId}/activity`,
      { minutes },
    );
  },
};

export const notesRepository = {
  list() {
    return get<Note[]>("/notes");
  },

  markRead(noteId: number) {
    return post<{
      id: number;
      is_read: boolean;
      read_at: string | null;
    }>(`/notes/${noteId}/read`);
  },
};
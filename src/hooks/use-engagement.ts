import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  announcementsRepository,
  attendanceRepository,
  bookmarksRepository,
  calendarRepository,
  certificatesRepository,
  dashboardRepository,
  helpRepository,
  leaderboardRepository,
  notificationsRepository,
  progressRepository,
  searchRepository,
  settingsRepository,
} from "@/api/repositories";
import { qk } from "@/lib/query-keys";
import type {
  AttendanceParams,
  BookmarkableType,
  Leaderboard,
  ListParams,
  UserSettings,
} from "@/types";

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: () => dashboardRepository.get() });
}

/* ------------------------------- Attendance ------------------------------- */

export function useAttendance(params: AttendanceParams = {}) {
  return useQuery({
    queryKey: qk.attendance(params),
    queryFn: () => attendanceRepository.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAttendanceSummary(params: Pick<AttendanceParams, "course_id" | "from" | "to"> = {}) {
  return useQuery({
    queryKey: qk.attendanceSummary(params),
    queryFn: () => attendanceRepository.summary(params),
  });
}

/* ---------------------------- Certificates etc ---------------------------- */

export function useCertificates() {
  return useQuery({ queryKey: qk.certificates, queryFn: () => certificatesRepository.list() });
}

export function useProgress() {
  return useQuery({ queryKey: qk.progress, queryFn: () => progressRepository.overview() });
}

export function useLeaderboard(period: Leaderboard["period"] = "weekly") {
  return useQuery({
    queryKey: qk.leaderboard(period),
    queryFn: () => leaderboardRepository.get(period),
  });
}

/* ------------------------------ Announcements ----------------------------- */

export function useAnnouncements(params: ListParams & { course_id?: number } = {}) {
  return useQuery({
    queryKey: qk.announcements(params),
    queryFn: () => announcementsRepository.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAnnouncement(announcementId: number | string) {
  return useQuery({
    queryKey: qk.announcement(announcementId),
    queryFn: () => announcementsRepository.get(announcementId),
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: number) => announcementsRepository.markRead(announcementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

/* ------------------------------ Notifications ----------------------------- */

export function useNotifications(params: ListParams & { unread?: boolean } = {}) {
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: () => notificationsRepository.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useNotificationCounts() {
  return useQuery({
    queryKey: qk.notificationCounts,
    queryFn: () => notificationsRepository.counts(),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsRepository.markRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsRepository.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/* -------------------------------- Bookmarks ------------------------------- */

export function useBookmarks(params: { type?: BookmarkableType } & ListParams = {}) {
  return useQuery({
    queryKey: qk.bookmarks(params),
    queryFn: () => bookmarksRepository.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      id,
      bookmarked,
    }: {
      type: BookmarkableType;
      id: number;
      /** Desired end state. */
      bookmarked: boolean;
    }) => (bookmarked ? bookmarksRepository.add(type, id) : bookmarksRepository.remove(type, id)),
    onSuccess: (_data, { type, id }) => {
      void queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      if (type === "course") {
        void queryClient.invalidateQueries({ queryKey: qk.course(id) });
        void queryClient.invalidateQueries({ queryKey: ["courses"] });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["lessons"] });
      }
    },
  });
}

/* --------------------------- Calendar and search -------------------------- */

export function useCalendar(from: string, to: string) {
  return useQuery({
    queryKey: qk.calendar(from, to),
    queryFn: () => calendarRepository.events(from, to),
    placeholderData: (previous) => previous,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: qk.search(query),
    queryFn: () => searchRepository.search(query),
    enabled: query.trim().length >= 2,
    placeholderData: (previous) => previous,
  });
}

/* ------------------------------- Help Center ------------------------------ */

export function useHelpCategories() {
  return useQuery({ queryKey: qk.helpCategories, queryFn: () => helpRepository.categories() });
}

export function useHelpArticles(params: ListParams & { category?: string } = {}) {
  return useQuery({
    queryKey: qk.helpArticles(params),
    queryFn: () => helpRepository.articles(params),
    placeholderData: (previous) => previous,
  });
}

export function useHelpArticle(slug: string) {
  return useQuery({ queryKey: qk.helpArticle(slug), queryFn: () => helpRepository.article(slug) });
}

export function useFaqs() {
  return useQuery({ queryKey: qk.faqs, queryFn: () => helpRepository.faqs() });
}

/* -------------------------------- Settings -------------------------------- */

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: () => settingsRepository.get() });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<UserSettings>) => settingsRepository.update(payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(qk.settings, settings);
    },
  });
}

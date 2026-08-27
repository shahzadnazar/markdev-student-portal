import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  announcementsRepository,
  attendanceRepository,
  bookmarksRepository,
  leavesRepository,
  calendarRepository,
  certificatesRepository,
  dashboardRepository,
  helpRepository,
  leaderboardRepository,
  notificationsRepository,
  progressRepository,
  searchRepository,
  settingsRepository,
  lessonActivityRepository,
   notesRepository,
} from "@/api/repositories";

import { qk } from "@/lib/query-keys";
import type {
  ApplyLeavePayload,
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

export function useDailyAttendance(params: { page?: number; per_page?: number } = {}) {
  return useQuery({
    queryKey: qk.attendanceDaily(params),
    queryFn: () => attendanceRepository.daily(params),
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

/* ---------------------------- Leave applications --------------------------- */

export function useLeaveApplications() {
  return useQuery({ queryKey: qk.leaves, queryFn: () => leavesRepository.list() });
}

export function useApplyForLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyLeavePayload) => leavesRepository.apply(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.leaves });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
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
    mutationFn: async ({
      type,
      id,
      bookmarked,
    }: {
      type: BookmarkableType;
      id: number;
      /** Desired end state. */
      bookmarked: boolean;
    }) => {
      if (bookmarked) {
        await bookmarksRepository.add(type, id);
      } else {
        await bookmarksRepository.remove(type, id);
      }
    },
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
export function useTrackLessonActivity() {
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      minutes,
    }: {
      courseId: string | number;
      lessonId: string | number;
      minutes: number;
    }) => lessonActivityRepository.track(courseId, lessonId, minutes),
  });
}
export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: () => notesRepository.list(),
  });
}
export function useMarkNoteRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) =>
      notesRepository.markRead(noteId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notes"],
      });

      void queryClient.invalidateQueries({
        queryKey: qk.progress,
      });

      void queryClient.invalidateQueries({
        queryKey: qk.dashboard,
      });
    },
  });
}
/* --------------------------- Live announcements --------------------------- */

/**
 * Announcements inside their 24-hour window, for the ticker and the popup.
 *
 * Polled rather than fetched once so a notice posted while a student is
 * already signed in still reaches them without a reload.
 */
export function useLiveAnnouncements() {
  return useQuery({
    queryKey: qk.liveAnnouncements,
    queryFn: () => announcementsRepository.live(),
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });
}

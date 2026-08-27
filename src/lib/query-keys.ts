import type {
  AssignmentListParams,
  AttendanceParams,
  BookmarkableType,
  CourseListParams,
  InvoiceListParams,
  Leaderboard,
  ListParams,
  QuizListParams,
  TransactionListParams,
} from "@/types";

/** Central query-key factory — the single source of truth for cache identity. */
export const qk = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,

  courses: (params: CourseListParams = {}) => ["courses", params] as const,
  course: (id: number | string) => ["courses", "detail", String(id)] as const,
  courseModules: (id: number | string) => ["courses", "detail", String(id), "modules"] as const,
  categories: ["categories"] as const,

  lesson: (courseId: number | string, lessonId: number | string) =>
    ["lessons", String(courseId), String(lessonId)] as const,
  lessonComments: (lessonId: number | string) => ["lessons", "comments", String(lessonId)] as const,

  assignments: (params: AssignmentListParams = {}) => ["assignments", params] as const,
  assignment: (id: number | string) => ["assignments", "detail", String(id)] as const,

  quizzes: (params: QuizListParams = {}) => ["quizzes", params] as const,
  quiz: (id: number | string) => ["quizzes", "detail", String(id)] as const,
  quizAttempts: (id: number | string) => ["quizzes", "detail", String(id), "attempts"] as const,
  quizResult: (quizId: number | string, attemptId: number | string) =>
    ["quizzes", "result", String(quizId), String(attemptId)] as const,

  attendance: (params: AttendanceParams = {}) => ["attendance", params] as const,
  attendanceSummary: (params: object = {}) => ["attendance", "summary", params] as const,
  attendanceDaily: (params: object = {}) => ["attendance", "daily", params] as const,

  certificates: ["certificates"] as const,
  progress: ["progress"] as const,
  liveAnnouncements: ["announcements", "live"] as const,
  leaves: ["leaves"] as const,
  leaderboard: (period: Leaderboard["period"]) => ["leaderboard", period] as const,

  announcements: (params: object = {}) => ["announcements", params] as const,
  announcement: (id: number | string) => ["announcements", "detail", String(id)] as const,

  notifications: (params: object = {}) => ["notifications", params] as const,
  notificationCounts: ["notifications", "counts"] as const,

  bookmarks: (params: { type?: BookmarkableType } & ListParams = {}) => ["bookmarks", params] as const,

  calendar: (from: string, to: string) => ["calendar", from, to] as const,
  search: (query: string) => ["search", query] as const,

  helpCategories: ["help", "categories"] as const,
  helpArticles: (params: object = {}) => ["help", "articles", params] as const,
  helpArticle: (slug: string) => ["help", "article", slug] as const,
  faqs: ["help", "faqs"] as const,

  settings: ["settings"] as const,

  billing: ["billing"] as const,
  billingTransactions: (params: TransactionListParams = {}) =>
    ["billing", "transactions", params] as const,
  billingInvoices: (params: InvoiceListParams = {}) => ["billing", "invoices", params] as const,
} as const;

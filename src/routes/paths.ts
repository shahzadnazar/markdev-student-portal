/** Central route table — always build links from here, never hardcode. */
export const paths = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  dashboard: "/",
  courses: "/courses",
  course: (courseId: number | string) => `/courses/${courseId}`,
  lesson: (courseId: number | string, lessonId: number | string) =>
    `/courses/${courseId}/lessons/${lessonId}`,

  assignments: "/assignments",
  assignment: (assignmentId: number | string) => `/assignments/${assignmentId}`,

  quizzes: "/quizzes",
  quiz: (quizId: number | string) => `/quizzes/${quizId}`,
  quizTake: (quizId: number | string) => `/quizzes/${quizId}/take`,
  quizResult: (quizId: number | string, attemptId: number | string) =>
    `/quizzes/${quizId}/results/${attemptId}`,

  certificates: "/certificates",
  attendance: "/attendance",
  progress: "/progress",
  leaderboard: "/leaderboard",
  announcements: "/announcements",
  notifications: "/notifications",
  bookmarks: "/bookmarks",
  materials: "/materials",
  search: "/search",
  calendar: "/calendar",

  payments: "/payments",
  profile: "/profile",
  settings: "/settings",
  help: "/help",
  helpArticle: (slug: string) => `/help/articles/${slug}`,
} as const;

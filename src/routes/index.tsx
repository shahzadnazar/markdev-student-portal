import { lazy, Suspense, type JSX } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { AuthLayout } from "@/components/layout/auth-layout";
import { PageLoader } from "@/components/shared/page-loader";
import { RequireAuth, RequireGuest } from "./guards";

const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password-page"));

const DashboardPage = lazy(() => import("@/pages/dashboard/dashboard-page"));
const CoursesPage = lazy(() => import("@/pages/courses/courses-page"));
const CourseDetailPage = lazy(() => import("@/pages/courses/course-detail-page"));
const LessonPlayerPage = lazy(() => import("@/pages/lessons/lesson-player-page"));

const AssignmentsPage = lazy(() => import("@/pages/assignments/assignments-page"));
const AssignmentDetailPage = lazy(() => import("@/pages/assignments/assignment-detail-page"));

const QuizzesPage = lazy(() => import("@/pages/quizzes/quizzes-page"));
const QuizDetailPage = lazy(() => import("@/pages/quizzes/quiz-detail-page"));
const QuizTakePage = lazy(() => import("@/pages/quizzes/quiz-take-page"));
const QuizResultPage = lazy(() => import("@/pages/quizzes/quiz-result-page"));

const CertificatesPage = lazy(() => import("@/pages/certificates/certificates-page"));
const AttendancePage = lazy(() => import("@/pages/attendance/attendance-page"));
const ProgressPage = lazy(() => import("@/pages/progress/progress-page"));
const LeaderboardPage = lazy(() => import("@/pages/leaderboard/leaderboard-page"));

const AnnouncementsPage = lazy(() => import("@/pages/announcements/announcements-page"));
const NotificationsPage = lazy(() => import("@/pages/notifications/notifications-page"));
const BookmarksPage = lazy(() => import("@/pages/bookmarks/bookmarks-page"));
const MaterialsPage = lazy(() => import("@/pages/materials/materials-page"));
const NotesPage = lazy(() => import("@/pages/notes/notes-page"));

const SearchPage = lazy(() => import("@/pages/search/search-page"));
const CalendarPage = lazy(() => import("@/pages/calendar/calendar-page"));

const PaymentsPage = lazy(() => import("@/pages/payments/payments-page"));
const ProfilePage = lazy(() => import("@/pages/profile/profile-page"));
const SettingsPage = lazy(() => import("@/pages/settings/settings-page"));

const HelpCenterPage = lazy(() => import("@/pages/help/help-center-page"));
const HelpArticlePage = lazy(() => import("@/pages/help/help-article-page"));

const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

function page(element: JSX.Element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/login",
            element: page(<LoginPage />),
          },
          {
            path: "/forgot-password",
            element: page(<ForgotPasswordPage />),
          },
          {
            path: "/reset-password",
            element: page(<ResetPasswordPage />),
          },
        ],
      },
    ],
  },

  {
    element: <RequireAuth />,
    children: [
      {
        path: "/courses/:courseId/lessons/:lessonId",
        element: page(<LessonPlayerPage />),
      },

      {
        path: "/quizzes/:quizId/take",
        element: page(<QuizTakePage />),
      },

      {
        element: <AppShell />,
        children: [
          {
            path: "/",
            element: page(<DashboardPage />),
          },
          {
            path: "/courses",
            element: page(<CoursesPage />),
          },
          {
            path: "/courses/:courseId",
            element: page(<CourseDetailPage />),
          },

          {
            path: "/assignments",
            element: page(<AssignmentsPage />),
          },
          {
            path: "/assignments/:assignmentId",
            element: page(<AssignmentDetailPage />),
          },

          {
            path: "/quizzes",
            element: page(<QuizzesPage />),
          },
          {
            path: "/quizzes/:quizId",
            element: page(<QuizDetailPage />),
          },
          {
            path: "/quizzes/:quizId/results/:attemptId",
            element: page(<QuizResultPage />),
          },

          {
            path: "/certificates",
            element: page(<CertificatesPage />),
          },
          {
            path: "/attendance",
            element: page(<AttendancePage />),
          },
          {
            path: "/progress",
            element: page(<ProgressPage />),
          },
          {
            path: "/leaderboard",
            element: page(<LeaderboardPage />),
          },

          {
            path: "/announcements",
            element: page(<AnnouncementsPage />),
          },
          {
            path: "/notifications",
            element: page(<NotificationsPage />),
          },
          {
            path: "/bookmarks",
            element: page(<BookmarksPage />),
          },
          {
            path: "/materials",
            element: page(<MaterialsPage />),
          },
          {
            path: "/notes",
            element: page(<NotesPage />),
          },

          {
            path: "/search",
            element: page(<SearchPage />),
          },
          {
            path: "/calendar",
            element: page(<CalendarPage />),
          },

          {
            path: "/payments",
            element: page(<PaymentsPage />),
          },
          {
            path: "/profile",
            element: page(<ProfilePage />),
          },
          {
            path: "/settings",
            element: page(<SettingsPage />),
          },

          {
            path: "/help",
            element: page(<HelpCenterPage />),
          },
          {
            path: "/help/articles/:slug",
            element: page(<HelpArticlePage />),
          },

          {
            path: "*",
            element: page(<NotFoundPage />),
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
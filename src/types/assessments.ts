import type { ListParams } from "./api";
import type { Resource } from "./catalog";

export interface CourseRef {
  id: number;
  title: string;
  slug: string;
  thumbnail_url: string | null;
}

/* ------------------------------ Assignments ------------------------------ */

export type AssignmentStatus = "pending" | "submitted" | "graded" | "overdue";

export interface Assignment {
  id: number;
  course: CourseRef;
  lesson_id: number | null;
  title: string;
  description: string | null;
  /** Rich-text/HTML brief. */
  instructions: string | null;
  due_at: string | null;
  max_score: number;
  attachments: Resource[];
  status: AssignmentStatus;
  submission: AssignmentSubmission | null;
  created_at: string;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  submitted_at: string;
  is_late: boolean;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export interface AssignmentListParams extends ListParams {
  status?: AssignmentStatus;
  course_id?: number;
}

export interface SubmitAssignmentPayload {
  content?: string;
  /** Uploaded via multipart when present. */
  file?: File | null;
}

/* --------------------------------- Quizzes -------------------------------- */

export type QuizStatus = "not_started" | "in_progress" | "passed" | "failed";

export interface Quiz {
  id: number;
  course: CourseRef;
  lesson_id: number | null;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  attempts_used: number;
  questions_count: number;
  total_points: number;
  /** Percentage (0–100) required to pass. */
  passing_score: number;
  status: QuizStatus;
  best_score: number | null;
  available_from: string | null;
  available_until: string | null;
}

export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer";

export interface Question {
  id: number;
  type: QuestionType;
  prompt: string;
  points: number;
  position: number;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  text: string;
}

/** An in-flight attempt: questions come WITHOUT correct answers. */
export interface QuizAttempt {
  id: number;
  quiz_id: number;
  started_at: string;
  expires_at: string | null;
  questions: Question[];
}

export interface QuizAnswerPayload {
  question_id: number;
  selected_option_ids?: number[];
  answer_text?: string;
}

export interface SubmitQuizAttemptPayload {
  answers: QuizAnswerPayload[];
}

export interface QuizResultQuestion extends Question {
  correct_option_ids: number[];
  selected_option_ids: number[];
  answer_text: string | null;
  is_correct: boolean;
  points_awarded: number;
  explanation: string | null;
}

export interface QuizResult {
  id: number;
  quiz_id: number;
  quiz_title: string;
  course: CourseRef | null;
  started_at: string;
  submitted_at: string;
  score: number;
  max_score: number;
  /** Percentage 0–100. */
  percent: number;
  passed: boolean;
  questions: QuizResultQuestion[];
}

export interface QuizListParams extends ListParams {
  status?: QuizStatus;
  course_id?: number;
}

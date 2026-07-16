import { get, getRaw, post } from "@/api/client";
import type {
  Assignment,
  AssignmentListParams,
  AssignmentSubmission,
  Paginated,
  Quiz,
  QuizAttempt,
  QuizListParams,
  QuizResult,
  SubmitAssignmentPayload,
  SubmitQuizAttemptPayload,
} from "@/types";

export const assignmentsRepository = {
  list(params: AssignmentListParams = {}) {
    return getRaw<Paginated<Assignment>>("/assignments", { params });
  },

  get(assignmentId: number | string) {
    return get<Assignment>(`/assignments/${assignmentId}`);
  },

  submit(assignmentId: number | string, payload: SubmitAssignmentPayload) {
    const form = new FormData();
    if (payload.content) form.append("content", payload.content);
    if (payload.file) form.append("file", payload.file);
    return post<AssignmentSubmission>(`/assignments/${assignmentId}/submissions`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const quizzesRepository = {
  list(params: QuizListParams = {}) {
    return getRaw<Paginated<Quiz>>("/quizzes", { params });
  },

  get(quizId: number | string) {
    return get<Quiz>(`/quizzes/${quizId}`);
  },

  /** Starts (or resumes) an attempt; the payload carries the questions. */
  startAttempt(quizId: number | string) {
    return post<QuizAttempt>(`/quizzes/${quizId}/attempts`);
  },

  submitAttempt(quizId: number | string, attemptId: number | string, payload: SubmitQuizAttemptPayload) {
    return post<QuizResult>(`/quizzes/${quizId}/attempts/${attemptId}/submit`, payload);
  },

  result(quizId: number | string, attemptId: number | string) {
    return get<QuizResult>(`/quizzes/${quizId}/attempts/${attemptId}`);
  },

  attempts(quizId: number | string) {
    return get<QuizResult[]>(`/quizzes/${quizId}/attempts`);
  },
};

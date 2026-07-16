import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignmentsRepository, quizzesRepository } from "@/api/repositories";
import { qk } from "@/lib/query-keys";
import type {
  AssignmentListParams,
  QuizListParams,
  SubmitAssignmentPayload,
  SubmitQuizAttemptPayload,
} from "@/types";

/* ------------------------------ Assignments ------------------------------ */

export function useAssignments(params: AssignmentListParams = {}) {
  return useQuery({
    queryKey: qk.assignments(params),
    queryFn: () => assignmentsRepository.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAssignment(assignmentId: number | string) {
  return useQuery({
    queryKey: qk.assignment(assignmentId),
    queryFn: () => assignmentsRepository.get(assignmentId),
  });
}

export function useSubmitAssignment(assignmentId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitAssignmentPayload) => assignmentsRepository.submit(assignmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.assignment(assignmentId) });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

/* --------------------------------- Quizzes -------------------------------- */

export function useQuizzes(params: QuizListParams = {}) {
  return useQuery({
    queryKey: qk.quizzes(params),
    queryFn: () => quizzesRepository.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useQuiz(quizId: number | string) {
  return useQuery({
    queryKey: qk.quiz(quizId),
    queryFn: () => quizzesRepository.get(quizId),
  });
}

export function useQuizAttempts(quizId: number | string) {
  return useQuery({
    queryKey: qk.quizAttempts(quizId),
    queryFn: () => quizzesRepository.attempts(quizId),
  });
}

export function useStartQuizAttempt(quizId: number | string) {
  return useMutation({
    mutationFn: () => quizzesRepository.startAttempt(quizId),
  });
}

export function useSubmitQuizAttempt(quizId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptId, payload }: { attemptId: number; payload: SubmitQuizAttemptPayload }) =>
      quizzesRepository.submitAttempt(quizId, attemptId, payload),
    onSuccess: (result) => {
      queryClient.setQueryData(qk.quizResult(quizId, result.id), result);
      void queryClient.invalidateQueries({ queryKey: qk.quiz(quizId) });
      void queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useQuizResult(quizId: number | string, attemptId: number | string) {
  return useQuery({
    queryKey: qk.quizResult(quizId, attemptId),
    queryFn: () => quizzesRepository.result(quizId, attemptId),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesRepository, lessonsRepository } from "@/api/repositories";
import { qk } from "@/lib/query-keys";
import type { CourseListParams } from "@/types";

export function useCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: qk.courses(params),
    queryFn: () => coursesRepository.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCourse(courseId: number | string) {
  return useQuery({
    queryKey: qk.course(courseId),
    queryFn: () => coursesRepository.get(courseId),
  });
}

export function useCourseModules(courseId: number | string) {
  return useQuery({
    queryKey: qk.courseModules(courseId),
    queryFn: () => coursesRepository.modules(courseId),
    // Callers pass "" while the course they belong to is still loading, which
    // used to fire GET /courses//modules and take a 404 on every page load.
    // Held here rather than at each call site so no caller has to remember.
    enabled: courseId !== "" && courseId !== 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: () => coursesRepository.categories(),
    staleTime: 5 * 60_000,
  });
}

export function useEnroll(courseId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => coursesRepository.enroll(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.course(courseId) });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useLesson(courseId: number | string, lessonId: number | string) {
  return useQuery({
    queryKey: qk.lesson(courseId, lessonId),
    queryFn: () => lessonsRepository.get(courseId, lessonId),
  });
}

export function useCompleteLesson(courseId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: number; completed: boolean }) =>
      completed
        ? lessonsRepository.complete(courseId, lessonId)
        : lessonsRepository.uncomplete(courseId, lessonId),
    onSuccess: (_data, { lessonId }) => {
      void queryClient.invalidateQueries({ queryKey: qk.lesson(courseId, lessonId) });
      void queryClient.invalidateQueries({ queryKey: qk.courseModules(courseId) });
      void queryClient.invalidateQueries({ queryKey: qk.course(courseId) });
      void queryClient.invalidateQueries({ queryKey: qk.progress });
    },
  });
}

export function useLessonComments(lessonId: number | string) {
  return useQuery({
    queryKey: qk.lessonComments(lessonId),
    queryFn: () => lessonsRepository.comments(lessonId),
  });
}

/**
 * The student's own notebook for this lesson.
 *
 * Its own query key, never merged into the lesson cache: a private note must
 * not ride along in a payload the rest of the cohort's UI also reads.
 */
export function useLessonPrivateNote(lessonId: number | string) {
  return useQuery({
    queryKey: qk.lessonPrivateNote(lessonId),
    queryFn: () => lessonsRepository.privateNote(lessonId),
  });
}

export function useSavePrivateNote(lessonId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => lessonsRepository.savePrivateNote(lessonId, body),
    onSuccess: (note) => {
      // The server answers 204 with no body when the note is cleared, so fall
      // back to an empty one rather than caching undefined.
      queryClient.setQueryData(qk.lessonPrivateNote(lessonId), note ?? {
        lesson_id: Number(lessonId),
        body: "",
        updated_at: null,
      });
    },
  });
}

export function useEditComment(lessonId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      lessonsRepository.editComment(lessonId, commentId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.lessonComments(lessonId) });
    },
  });
}

export function useDeleteComment(lessonId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => lessonsRepository.deleteComment(lessonId, commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.lessonComments(lessonId) });
    },
  });
}

export function useAddComment(lessonId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: number }) =>
      lessonsRepository.addComment(lessonId, body, parentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.lessonComments(lessonId) });
    },
  });
}

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

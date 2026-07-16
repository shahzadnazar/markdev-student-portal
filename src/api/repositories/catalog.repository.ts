import { destroy, get, getRaw, post } from "@/api/client";
import type {
  Category,
  Comment,
  Course,
  CourseListParams,
  Enrollment,
  Lesson,
  Module,
  Paginated,
} from "@/types";

export const coursesRepository = {
  list(params: CourseListParams = {}) {
    return getRaw<Paginated<Course>>("/courses", { params });
  },

  get(courseId: number | string) {
    return get<Course>(`/courses/${courseId}`);
  },

  modules(courseId: number | string) {
    return get<Module[]>(`/courses/${courseId}/modules`);
  },

  enroll(courseId: number | string) {
    return post<Enrollment>(`/courses/${courseId}/enroll`);
  },

  categories() {
    return get<Category[]>("/categories");
  },
};

export const lessonsRepository = {
  get(courseId: number | string, lessonId: number | string) {
    return get<Lesson>(`/courses/${courseId}/lessons/${lessonId}`);
  },

  complete(courseId: number | string, lessonId: number | string) {
    return post<{ progress_percent: number }>(`/courses/${courseId}/lessons/${lessonId}/complete`);
  },

  uncomplete(courseId: number | string, lessonId: number | string) {
    return destroy<{ progress_percent: number }>(`/courses/${courseId}/lessons/${lessonId}/complete`);
  },

  comments(lessonId: number | string) {
    return get<Comment[]>(`/lessons/${lessonId}/comments`);
  },

  addComment(lessonId: number | string, body: string, parentId?: number) {
    return post<Comment>(`/lessons/${lessonId}/comments`, { body, parent_id: parentId ?? null });
  },
};

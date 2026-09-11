import { destroy, get, getRaw, post, put } from "@/api/client";
import type {
  Category,
  Comment,
  Course,
  CourseListParams,
  Enrollment,
  Lesson,
  Module,
  Paginated,
  VideoProgress,
  PrivateNote,
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

  /** Report the ranges of the lesson video that were played. */
  videoProgress(
    courseId: number | string,
    lessonId: number | string,
    payload: { duration: number; position: number; segments: [number, number][] },
  ) {
    return post<VideoProgress>(
      `/courses/${courseId}/lessons/${lessonId}/video-progress`,
      payload,
    );
  },

  comments(lessonId: number | string) {
    return get<Comment[]>(`/lessons/${lessonId}/comments`);
  },

  addComment(lessonId: number | string, body: string, parentId?: number) {
    return post<Comment>(`/lessons/${lessonId}/comments`, { body, parent_id: parentId ?? null });
  },

  editComment(lessonId: number | string, commentId: number, body: string) {
    return put<Comment>(`/lessons/${lessonId}/comments/${commentId}`, { body });
  },

  deleteComment(lessonId: number | string, commentId: number) {
    return destroy<void>(`/lessons/${lessonId}/comments/${commentId}`);
  },

  /**
   * The student's own notebook for this lesson.
   *
   * Its own endpoint, never folded into the lesson payload: a private note
   * has no business travelling in a response that also carries the public
   * discussion.
   */
  privateNote(lessonId: number | string) {
    return get<PrivateNote>(`/lessons/${lessonId}/private-note`);
  },

  savePrivateNote(lessonId: number | string, body: string) {
    return put<PrivateNote>(`/lessons/${lessonId}/private-note`, { body });
  },
};

import type { CourseAudience, CourseStatus } from '../schemas/course.schema';

export type CourseListFilters = {
  status?: CourseStatus;
  audience?: CourseAudience;
  search?: string;
  page?: number;
  limit?: number;
};

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: CourseListFilters) => [...courseKeys.lists(), params ?? {}] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  academySettings: ['academy-settings'] as const,
  learners: (courseId: string, params?: Record<string, unknown>) =>
    [...courseKeys.all, 'learners', courseId, params ?? {}] as const,
  allLearners: (params?: Record<string, unknown>) =>
    [...courseKeys.all, 'all-learners', params ?? {}] as const,
  export: (scope: string) => [...courseKeys.all, 'export', scope] as const,

  modules: (courseId: string) => [...courseKeys.all, 'modules', courseId] as const,

  blocks: (moduleId: string) => [...courseKeys.all, 'blocks', moduleId] as const,

  media: (mediaId: string) => [...courseKeys.all, 'media', mediaId] as const,

  quizForModule: (moduleId: string) => [...courseKeys.all, 'quiz-for-module', moduleId] as const,
  quizSettings: (id: string) => [...courseKeys.all, 'quiz-settings', id] as const,
  quizQuestions: (quizSettingsId: string) => [...courseKeys.all, 'quiz-questions', quizSettingsId] as const,
  courseQuiz: (courseId: string) => [...courseKeys.all, 'course-quiz', courseId] as const,
};

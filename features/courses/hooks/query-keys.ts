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
  summary: () => [...courseKeys.all, 'summary'] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  academySettings: ['academy-settings'] as const,
};

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPost } from '@/lib/api-client';

import { CourseSchema, CourseSummarySchema, type CourseAudience } from '../schemas/course.schema';
import { courseKeys, type CourseListFilters } from './query-keys';

export const DEFAULT_COURSE_LIMIT = 20;

export const useCourseList = (filters?: CourseListFilters) => {
  const { page = 1, limit = DEFAULT_COURSE_LIMIT, ...rest } = filters ?? {};
  return useQuery({
    queryKey: courseKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/courses', CourseSchema, {
        params: {
          page,
          limit,
          status: rest.status,
          audience: rest.audience,
          search: rest.search || undefined,
        },
      }),
  });
};

/** Counts for the filter chips — unaffected by whichever filter is currently applied. */
export const useCourseSummary = () =>
  useQuery({
    queryKey: courseKeys.summary(),
    queryFn: () => apiGet('/admin/courses/summary', CourseSummarySchema),
  });

export type CreateCoursePayload = {
  title: string;
  audience: CourseAudience;
  summary: string;
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoursePayload) =>
      apiPost('/admin/courses', payload, CourseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.summary() });
    },
  });
};

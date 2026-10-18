'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGetPaged, apiPost } from '@/lib/api-client';

import { CourseSchema, type CourseAudience } from '../schemas/course.schema';
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
          // The wire param is `q`, not `search` — CourseListQueryDto has no `search`
          // field, and the BE's global ValidationPipe (forbidNonWhitelisted) 400s on
          // any unrecognized query key rather than ignoring it.
          q: rest.search || undefined,
        },
      }),
  });
};

export type CourseSummary = {
  total: number;
  published: number;
  draft: number;
  realtor: number;
  buyer: number;
};

/**
 * There is no `/admin/courses/summary` aggregate on the BE — see
 * docs/COURSE-LEARNERS-BACKEND-GAPS.md. Same pattern as `useAgencyStats`:
 * five `limit=1` list calls read off `meta.total`, since a filtered count is
 * all any of these chips need.
 */
export const useCourseSummary = () => {
  const all = useCourseList({ page: 1, limit: 1 });
  const published = useCourseList({ page: 1, limit: 1, status: 'published' });
  const draft = useCourseList({ page: 1, limit: 1, status: 'draft' });
  const realtor = useCourseList({ page: 1, limit: 1, audience: 'realtor' });
  const buyer = useCourseList({ page: 1, limit: 1, audience: 'buyer' });

  const queries = [all, published, draft, realtor, buyer];
  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;

  const data: CourseSummary | undefined = isLoading
    ? undefined
    : {
        total: all.data?.meta.total ?? 0,
        published: published.data?.meta.total ?? 0,
        draft: draft.data?.meta.total ?? 0,
        realtor: realtor.data?.meta.total ?? 0,
        buyer: buyer.data?.meta.total ?? 0,
      };

  return { data, isLoading, error };
};

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
      // Covers the summary chips too — useCourseSummary is just five more courseKeys.list(...) queries.
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { z } from 'zod';

import { apiGetPaged } from '@/lib/api-client';

import {
  EnrolmentRowSchema,
  GlobalEnrolmentRowSchema,
  type EnrolmentRow,
  type GlobalEnrolmentRow,
} from '../schemas/learner.schema';
import { courseKeys } from './query-keys';

export const DEFAULT_LEARNERS_LIMIT = 20;

export interface CourseLearnersFilters {
  page?: number;
  limit?: number;
}

/** `GET /admin/courses/:id/learners` — this course's enrolments, newest first isn't guaranteed by the BE, paginated. */
export const useCourseLearners = (courseId: string, filters: CourseLearnersFilters = {}) => {
  const { page = 1, limit = DEFAULT_LEARNERS_LIMIT } = filters;
  return useQuery({
    queryKey: courseKeys.learners(courseId, { page, limit }),
    queryFn: () =>
      apiGetPaged(`/admin/courses/${courseId}/learners`, EnrolmentRowSchema, {
        params: { page, limit },
      }),
    enabled: Boolean(courseId),
  });
};

export interface AllLearnersFilters extends CourseLearnersFilters {
  course_id?: string;
}

/** `GET /admin/learners` — every enrolment across every course, one row each (not per associate). */
export const useAllLearners = (filters: AllLearnersFilters = {}) => {
  const { page = 1, limit = DEFAULT_LEARNERS_LIMIT, course_id } = filters;
  return useQuery({
    queryKey: courseKeys.allLearners({ page, limit, course_id }),
    queryFn: () =>
      apiGetPaged('/admin/learners', GlobalEnrolmentRowSchema, {
        params: { page, limit, course_id },
      }),
  });
};

const EXPORT_PAGE_SIZE = 100;
export const LEARNERS_EXPORT_ROW_CAP = 1_000;

export interface LearnersExportResult<T> {
  rows: T[];
  truncated: boolean;
}

/** Loops pages into one export set — mirrors use-event-registrations-export.ts's pattern. */
async function fetchAllPages<T>(
  path: string,
  schema: z.ZodTypeAny,
  params: Record<string, unknown>
): Promise<LearnersExportResult<T>> {
  const rows: T[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < LEARNERS_EXPORT_ROW_CAP) {
    const { items, meta } = await apiGetPaged(path, schema, {
      params: { ...params, page, limit: EXPORT_PAGE_SIZE },
    });
    total = meta.total ?? items.length;
    rows.push(...(items as T[]));
    if (items.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  return { rows, truncated: rows.length < total };
}

export const useCourseLearnersExport = () =>
  useMutation({
    mutationKey: courseKeys.export('course-learners'),
    mutationFn: (courseId: string) =>
      fetchAllPages<EnrolmentRow>(`/admin/courses/${courseId}/learners`, EnrolmentRowSchema, {}),
  });

export const useAllLearnersExport = () =>
  useMutation({
    mutationKey: courseKeys.export('all-learners'),
    mutationFn: (filters: { course_id?: string } = {}) =>
      fetchAllPages<GlobalEnrolmentRow>('/admin/learners', GlobalEnrolmentRowSchema, filters),
  });

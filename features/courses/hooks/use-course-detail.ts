'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';

import { AcademySettingsSchema } from '../schemas/academy-settings.schema';
import { CourseDetailSchema, CourseSchema, type CourseAudience } from '../schemas/course.schema';
import { courseKeys } from './query-keys';

export const useCourseDetail = (id: string) =>
  useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => apiGet(`/admin/courses/${id}`, CourseDetailSchema),
    enabled: Boolean(id),
  });

export type UpdateCoursePayload = Partial<{
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  audience: CourseAudience;
  estimated_minutes: number;
  grants_credential: boolean;
  credential_validity_months: number | null;
}>;

export const useUpdateCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoursePayload) => apiPatch(`/admin/courses/${id}`, payload, CourseSchema),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(id), (prev: unknown) =>
        prev && typeof prev === 'object' ? { ...prev, ...updated } : updated
      );
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

/**
 * `POST /admin/courses/:id/publish` — not a generic status PATCH. Rejects an
 * empty course (`COURSE_EMPTY`, no modules or no content blocks yet) — that
 * will 400 until the Modules screen is wired and something is actually
 * authored, since content-block CRUD exists on the BE but nothing on this
 * screen calls it yet.
 */
export const usePublishCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost(`/admin/courses/${id}/publish`, {}, CourseSchema),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(id), (prev: unknown) =>
        prev && typeof prev === 'object' ? { ...prev, ...updated } : updated
      );
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

export const useUnpublishCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost(`/admin/courses/${id}/unpublish`, {}, CourseSchema),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(id), (prev: unknown) =>
        prev && typeof prev === 'object' ? { ...prev, ...updated } : updated
      );
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

const DeleteCourseResponseSchema = z.looseObject({});

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/courses/${id}`, DeleteCourseResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

export const useAcademySettings = () =>
  useQuery({
    queryKey: courseKeys.academySettings,
    queryFn: () => apiGet('/admin/academy-settings', AcademySettingsSchema),
  });

/** `PATCH /admin/academy-settings` — `null` clears the first-sale path. The BE 400s (`FIRST_SALE_COURSE_NOT_PUBLISHED`) unless the target course is already published. */
export const useSetFirstSalePath = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string | null) =>
      apiPatch('/admin/academy-settings', { first_sale_path_course_id: courseId }, AcademySettingsSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.academySettings });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.details() });
    },
  });
};

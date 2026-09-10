'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';

import { AcademySettingsSchema } from '../schemas/academy-settings.schema';
import {
  CourseSchema,
  type CourseAudience,
  type CourseStatus,
  type CredentialRenewal,
} from '../schemas/course.schema';
import { courseKeys } from './query-keys';

export const useCourseDetail = (id: string) =>
  useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => apiGet(`/admin/courses/${id}`, CourseSchema),
    enabled: Boolean(id),
  });

export type UpdateCoursePayload = Partial<{
  title: string;
  summary: string;
  audience: CourseAudience;
  estate_id: string | null;
  cover_url: string | null;
  grants_credential: boolean;
  credential_validity_months: number | null;
  credential_renewal: CredentialRenewal | null;
}>;

export const useUpdateCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoursePayload) =>
      apiPatch(`/admin/courses/${id}`, payload, CourseSchema),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

export const useSetCourseStatus = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: CourseStatus) =>
      apiPatch(`/admin/courses/${id}/status`, { status }, CourseSchema),
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.summary() });
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
      queryClient.invalidateQueries({ queryKey: courseKeys.summary() });
    },
  });
};

export const useAcademySettings = () =>
  useQuery({
    queryKey: courseKeys.academySettings,
    queryFn: () => apiGet('/admin/academy-settings', AcademySettingsSchema),
  });

export const useSetFirstSalePath = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiPost(
        '/admin/academy-settings/first-sale-path',
        { course_id: courseId },
        AcademySettingsSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.academySettings });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.details() });
    },
  });
};

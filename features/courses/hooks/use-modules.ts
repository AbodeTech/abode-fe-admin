'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';

import { CourseModuleRefSchema, type CourseModuleRef } from '../schemas/course.schema';
import { courseKeys } from './query-keys';

export const useModules = (courseId: string) =>
  useQuery({
    queryKey: courseKeys.modules(courseId),
    queryFn: () => apiGet(`/admin/courses/${courseId}/modules`, z.array(CourseModuleRefSchema)),
    enabled: Boolean(courseId),
  });

export const useCreateModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      apiPost(`/admin/courses/${courseId}/modules`, { title }, CourseModuleRefSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.modules(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
};

export const useUpdateModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      apiPatch(`/admin/modules/${id}`, { title }, CourseModuleRefSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.modules(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
};

const DeleteResponseSchema = z.looseObject({});

export const useDeleteModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => apiDelete(`/admin/modules/${moduleId}`, DeleteResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.modules(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
};

/** `PATCH /admin/modules/reorder` — one call for the whole set; BE 400s (`REORDER_SET_MISMATCH`) unless every existing module id is listed exactly once. */
export const useReorderModules = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiPatch('/admin/modules/reorder', { parent_id: courseId, ordered_ids: orderedIds }, z.array(CourseModuleRefSchema)),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.modules(courseId) });
      const previous = queryClient.getQueryData<CourseModuleRef[]>(courseKeys.modules(courseId));
      if (previous) {
        const byId = new Map(previous.map((m) => [m.id, m]));
        const optimistic = orderedIds
          .map((id, index) => {
            const mod = byId.get(id);
            return mod ? { ...mod, position: index + 1 } : null;
          })
          .filter((m): m is CourseModuleRef => m !== null);
        queryClient.setQueryData(courseKeys.modules(courseId), optimistic);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(courseKeys.modules(courseId), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.modules(courseId) });
    },
  });
};

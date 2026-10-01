'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';

import { ContentBlockRefSchema, type ContentBlockRef } from '../schemas/course.schema';
import { courseKeys } from './query-keys';

export const BLOCK_TYPES = ['text', 'video', 'image', 'file', 'quiz'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const useBlocks = (moduleId: string) =>
  useQuery({
    queryKey: courseKeys.blocks(moduleId),
    queryFn: () => apiGet(`/admin/modules/${moduleId}/blocks`, z.array(ContentBlockRefSchema)),
    enabled: Boolean(moduleId),
  });

export type CreateBlockPayload = { type: BlockType; payload: Record<string, unknown> };

export const useCreateBlock = (moduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBlockPayload) =>
      apiPost(`/admin/modules/${moduleId}/blocks`, dto, ContentBlockRefSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.blocks(moduleId) });
    },
  });
};

export const useUpdateBlock = (moduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiPatch(`/admin/content-blocks/${id}`, { payload }, ContentBlockRefSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.blocks(moduleId) });
    },
  });
};

const DeleteResponseSchema = z.looseObject({});

export const useDeleteBlock = (moduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) => apiDelete(`/admin/content-blocks/${blockId}`, DeleteResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.blocks(moduleId) });
    },
  });
};

/** `PATCH /admin/content-blocks/reorder` — same all-or-nothing set rule as module reorder. */
export const useReorderBlocks = (moduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiPatch(
        '/admin/content-blocks/reorder',
        { parent_id: moduleId, ordered_ids: orderedIds },
        z.array(ContentBlockRefSchema)
      ),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.blocks(moduleId) });
      const previous = queryClient.getQueryData<ContentBlockRef[]>(courseKeys.blocks(moduleId));
      if (previous) {
        const byId = new Map(previous.map((b) => [b.id, b]));
        const optimistic = orderedIds
          .map((id, index) => {
            const block = byId.get(id);
            return block ? { ...block, position: index + 1 } : null;
          })
          .filter((b): b is ContentBlockRef => b !== null);
        queryClient.setQueryData(courseKeys.blocks(moduleId), optimistic);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(courseKeys.blocks(moduleId), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.blocks(moduleId) });
    },
  });
};

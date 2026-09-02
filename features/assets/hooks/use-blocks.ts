'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';

import { BlockSchema } from '../schemas/block-plot.schema';
import { assetKeys } from './query-keys';

/**
 * Blocks under one asset.
 *
 *   GET    /admin/assets/:asset_id/blocks
 *   POST   /admin/assets/:asset_id/blocks   { label, description? }
 *   PATCH  /admin/blocks/:block_id          { label?, description? }
 *   DELETE /admin/blocks/:block_id
 *
 * Writes are only a signal that the change landed — every one invalidates and
 * re-reads, so their responses go unparsed. `forbidNonWhitelisted` is on, so
 * the bodies carry exactly the DTO's fields and nothing else.
 */
const WriteResultSchema = z.unknown();

export const useAssetBlocks = (assetId: string) =>
  useQuery({
    queryKey: assetKeys.blocks(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/blocks`, z.array(BlockSchema)),
    enabled: !!assetId,
  });

function useBlockMutation<TVariables, TData>(
  assetId: string,
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.blocks(assetId) });
    },
  });
}

export const useCreateBlock = (assetId: string) =>
  useBlockMutation(assetId, (payload: { label: string; description?: string }) =>
    apiPost(`/admin/assets/${assetId}/blocks`, payload, WriteResultSchema)
  );

export const useUpdateBlock = (assetId: string) =>
  useBlockMutation(
    assetId,
    ({ blockId, ...payload }: { blockId: string; label?: string; description?: string }) =>
      apiPatch(`/admin/blocks/${blockId}`, payload, WriteResultSchema)
  );

/** The BE refuses a block that still holds allocated plots (400). */
export const useDeleteBlock = (assetId: string) =>
  useBlockMutation(assetId, (blockId: string) =>
    apiDelete(`/admin/blocks/${blockId}`, WriteResultSchema)
  );

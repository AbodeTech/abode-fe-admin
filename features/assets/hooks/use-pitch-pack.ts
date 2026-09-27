'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiPut } from '@/lib/api-client';

import { PitchPackSchema, type AssetDetail } from '../schemas/asset-detail.schema';
import { assetKeys } from './query-keys';

/**
 * PUT /admin/assets/:id/pitch-pack — upload or replace the estate pitch pack.
 *
 * Its own endpoint, deliberately separate from `useUpdateAsset`'s PATCH, so a
 * pitch pack upload can never collide with an in-flight "Images and
 * documents" save and vice versa — the two panels save independently.
 */
export const useSetPitchPack = (assetId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { url: string; size_bytes: number }) =>
      apiPut(`/admin/assets/${assetId}/pitch-pack`, payload, PitchPackSchema),
    onSuccess: (pitch_pack) => {
      queryClient.setQueryData<AssetDetail>(assetKeys.detail(assetId), (current) =>
        current ? { ...current, pitch_pack } : current
      );
    },
  });
};

const RemovePitchPackResultSchema = z.object({ removed: z.boolean() });

/** DELETE /admin/assets/:id/pitch-pack. */
export const useRemovePitchPack = (assetId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiDelete(`/admin/assets/${assetId}/pitch-pack`, RemovePitchPackResultSchema),
    onSuccess: () => {
      queryClient.setQueryData<AssetDetail>(assetKeys.detail(assetId), (current) =>
        current ? { ...current, pitch_pack: null } : current
      );
    },
  });
};

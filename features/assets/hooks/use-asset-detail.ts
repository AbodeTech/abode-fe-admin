'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPatch } from '@/lib/api-client';

import { AssetDetailSchema } from '../schemas/asset-detail.schema';
import type { createAssetFormToPayload } from '../schemas/create-asset.schema';
import { assetKeys } from './query-keys';

/**
 * GET /admin/assets/:id — the full offer → size → plan tree.
 *
 * Every tab of the detail page calls this. React Query dedupes by key, so the
 * layout header and whichever tab is mounted share **one** request and one
 * cache entry — which is what makes sub-routes free here rather than four
 * fetches of the same asset.
 */
export const useAssetDetail = (assetId: string) =>
  useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}`, AssetDetailSchema),
    enabled: Boolean(assetId),
  });

/**
 * PATCH /admin/assets/:id — asset fields only.
 *
 * `UpdateAssetDto` is `PartialType(OmitType(CreateAssetDto, ['offers']))`, so
 * offers are **not** editable here; they have their own endpoint family. And
 * because `forbidNonWhitelisted` is on, sending `sold`, `sold_units` or
 * `reserved_units` is a hard 400 — those are derived, never set by an admin.
 */
export const useUpdateAsset = (assetId: string) => {
  const queryClient = useQueryClient();

  type AssetFields = Partial<Omit<ReturnType<typeof createAssetFormToPayload>, 'offers'>>;

  return useMutation({
    mutationFn: (payload: AssetFields) =>
      apiPatch(`/admin/assets/${assetId}`, payload, AssetDetailSchema),
    onSuccess: (updated) => {
      queryClient.setQueryData(assetKeys.detail(assetId), updated);
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGetPaged } from '@/lib/api-client';

import { AssetSchema } from '../schemas/asset.schema';
import { assetKeys, type AssetListFilters } from './query-keys';

export const DEFAULT_ASSET_LIMIT = 20;

/**
 * GET /admin/assets — one row per asset, carrying a per-offer summary.
 *
 * There is no flex list and no full-ownership list: an asset can have both
 * offers, so offer type is a filter facet rather than a separate query.
 *
 * Sorted `createdAt: -1` server-side with no sort parameter (⛔ ticket 16).
 * Soft-deleted assets are excluded unless `include_deleted` is set.
 */
export const useAssetList = (filters?: AssetListFilters) => {
  const { page = 1, limit = DEFAULT_ASSET_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: assetKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/assets', AssetSchema, {
        params: {
          page,
          limit,
          search: rest.search || undefined,
          visibility: rest.visibility,
          offer_type: rest.offer_type,
          // Only sent when true — `false` and `undefined` mean the same thing
          // to these filters, and omitting keeps the query string clean.
          sold: rest.sold ? true : undefined,
          include_deleted: rest.include_deleted ? true : undefined,
        },
      }),
  });
};

const DeleteAssetResponseSchema = z.looseObject({});

/**
 * DELETE /admin/assets/:id — a **soft delete**. The BE sets `deleted_at`; the
 * asset drops out of the catalogue but remains queryable with
 * `include_deleted=true`, and any payment plan referencing it still resolves.
 */
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) =>
      apiDelete(`/admin/assets/${assetId}`, DeleteAssetResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

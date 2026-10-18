'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGetPaged } from '@/lib/api-client';

/* ============================================================
 * Asset lookup for the override pickers.
 *
 * Deliberately minimal: `_id` and `name` only. The assets feature is still on
 * GraphQL, so there is no REST hook to reuse yet — and importing from an
 * unmigrated feature would be worse than a small local lookup.
 *
 * Replace with the assets feature's own hook when that migrates. This is a
 * picker data source, not a second assets client.
 * ============================================================ */

const AssetOptionSchema = z.object({
  _id: z.string(),
  /** abode-be-v2 calls this `name`; `asset_name` is the v1 spelling. */
  name: z.string().nullable().optional(),
  asset_name: z.string().nullable().optional(),
});

export type AssetOption = { id: string; label: string };

const OPTION_LIMIT = 20;

export const useAssetOptions = (search: string) =>
  useQuery({
    queryKey: ['commission', 'asset-options', search],
    queryFn: () =>
      apiGetPaged('/admin/assets', AssetOptionSchema, {
        params: { search: search || undefined, limit: OPTION_LIMIT },
      }),
    // The backend regex-searches name and location, so results change per
    // keystroke; keep them briefly to avoid refetching a repeated query.
    staleTime: 30_000,
    select: (data): AssetOption[] =>
      data.items.map((asset) => ({
        id: asset._id,
        label: asset.name ?? asset.asset_name ?? asset._id,
      })),
  });

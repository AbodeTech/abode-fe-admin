'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPost } from '@/lib/api-client';

import type { createAssetFormToPayload } from '../schemas/create-asset.schema';
import { assetKeys } from './query-keys';

type CreateAssetPayload = ReturnType<typeof createAssetFormToPayload>;

/**
 * Only what the caller actually reads — the id to redirect to and the name for
 * the toast.
 *
 * This previously parsed the full `AssetSchema` and rejected every successful
 * create. `AssetSchema` models a **list row**, whose `offers` are
 * `{ size_count, plan_count }` aggregates that only the list endpoint
 * computes; `POST /admin/assets` returns the created document, whose `offers`
 * are the real nested tree. Zod failed, `apiPost` threw `SCHEMA_MISMATCH`, and
 * the form reported an error for an asset that had been written.
 *
 * Validate what you consume. The authoritative read is `useAssetDetail` on the
 * page this redirects to, which parses the whole tree.
 */
const CreatedAssetSchema = z.looseObject({
  _id: z.string(),
  name: z.string(),
});

/**
 * POST /admin/assets — creates the asset, its offers, their sizes and every
 * plan in **one atomic request**. The backend wraps it in a transaction, so a
 * rejected plan on the last size means nothing is written.
 *
 * That is why the form validates the backend's structural rules before
 * submitting (see create-asset.schema.ts): a rejection here discards the whole
 * thing, and class-validator's message is not something an admin can act on.
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAssetPayload) =>
      apiPost('/admin/assets', payload, CreatedAssetSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

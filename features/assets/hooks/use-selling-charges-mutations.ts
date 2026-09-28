'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPut } from '@/lib/api-client';

import { SetSellingChargesResultSchema, type SetSellingChargesFormOutput } from '../schemas/selling-charges.schema';
import { assetKeys } from './query-keys';

/**
 * PUT /admin/assets/:assetId/selling-charges — approves a new version. The
 * response doesn't carry `reason`/`approved_by`, so this invalidates rather
 * than writes the mutation result into the cache — `current()` is refetched
 * for the full picture. No `expected_version` guard exists on the real PUT
 * (see the schema's own doc comment) — this is a deliberate, flagged gap, not
 * an oversight here.
 */
export const useSetSellingCharges = (assetId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SetSellingChargesFormOutput) =>
      apiPut(`/admin/assets/${assetId}/selling-charges`, values, SetSellingChargesResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.sellingCharges(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.sellingChargesHistory(assetId) });
    },
  });
};

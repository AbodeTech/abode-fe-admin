'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { SqmActivationResultSchema } from '../schemas/sqm-reconciliation.schema';
import { assetKeys } from './query-keys';

/**
 * POST /admin/assets/:assetId/sqm-inventory/activate — a one-way switch, no
 * body. Blocked (400 `LAND_CONFIGURATION_INCOMPLETE`) unless the
 * reconciliation report is `ready`; idempotent if already active. On success
 * this also changes `inventory_model_version` on the asset root, so refresh
 * both the sqm reads and the asset detail/list.
 */
export const useActivateSqmInventory = (assetId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost(`/admin/assets/${assetId}/sqm-inventory/activate`, {}, SqmActivationResultSchema),
    onSuccess: (result) => {
      queryClient.setQueryData(assetKeys.sqmReconciliation(assetId), result.report);
      queryClient.invalidateQueries({ queryKey: assetKeys.sqmInventory(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

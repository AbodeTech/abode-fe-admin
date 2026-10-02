'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiClientError, apiPut } from '@/lib/api-client';

import { SetSellingChargesResultSchema, type SetSellingChargesFormOutput } from '../schemas/selling-charges.schema';
import { assetKeys } from './query-keys';

/**
 * PUT /admin/assets/:assetId/selling-charges — approves a new version.
 *
 * Both outcomes re-read the server: a success because the response is only
 * the new version (not the in-force/scheduled picture), and a 409
 * `SELLING_CHARGE_VERSION_CONFLICT` because it means someone else saved
 * first, so what the editor loaded is out of date.
 */
export const useSetSellingCharges = (assetId: string) => {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: assetKeys.sellingCharges(assetId) });
    queryClient.invalidateQueries({ queryKey: assetKeys.sellingChargesHistory(assetId) });
  };

  return useMutation({
    mutationFn: (values: SetSellingChargesFormOutput) =>
      apiPut(`/admin/assets/${assetId}/selling-charges`, values, SetSellingChargesResultSchema),
    onSuccess: refresh,
    onError: (error) => {
      if (error instanceof ApiClientError && error.statusCode === 409) refresh();
    },
  });
};

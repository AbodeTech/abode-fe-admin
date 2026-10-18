'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPost } from '@/lib/api-client';

import type { SubmitGroundConfirmationFormValues } from '../schemas/ground-confirmation.schema';
import { assetKeys } from './query-keys';

const WriteResultSchema = z.unknown();

/**
 * `assetId` is only needed to invalidate the plot-inventory list (whose
 * totals live in the same response, not a separate query) — the write routes
 * themselves are addressed by plot id alone, matching block-plot.schema.ts's
 * existing `/admin/plots/:plotId` routes (a plot isn't nested under an
 * asset path anywhere else in this feature either).
 */
function invalidateGroundConfirmation(queryClient: ReturnType<typeof useQueryClient>, assetId: string, plotId: string) {
  // A verified report moves the plot badge, the reconciliation view, and the
  // sqm inventory's operational overlay.
  queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
  queryClient.invalidateQueries({ queryKey: ['plots', plotId, 'ground-confirmation'] });
}

export const useSubmitGroundConfirmation = (assetId: string, plotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitGroundConfirmationFormValues) =>
      apiPost(`/admin/plots/${plotId}/ground-confirmation`, payload, WriteResultSchema),
    onSuccess: () => invalidateGroundConfirmation(queryClient, assetId, plotId),
  });
};

export const useVerifyGroundConfirmation = (assetId: string, plotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (confirmationId: string) =>
      apiPost(`/admin/plots/${plotId}/ground-confirmation/${confirmationId}/verify`, {}, WriteResultSchema),
    onSuccess: () => invalidateGroundConfirmation(queryClient, assetId, plotId),
  });
};

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { runAddCost, type AddCostApi, type AddCostPlan, type AddCostProgress } from '../schemas/add-cost.schema';
import { AssetCostEventSchema, AssetCostItemSchema, ObligationDetailSchema } from '../schemas/asset-cost.schema';
import { assetKeys } from './query-keys';

/**
 * Runs the one-form "Add cost" plan (see `add-cost.schema.ts`): create the
 * cost item if it is new, create the record with its first entry, approve
 * that entry if asked.
 *
 * The caller owns `progress` and passes the same object on every attempt.
 * Whatever happens, the cost queries are refreshed afterwards — a failed
 * later step still leaves the earlier ones saved, and the page should show
 * them.
 */
export function useAddCost(assetId: string) {
  const queryClient = useQueryClient();

  const api: AddCostApi = {
    createItem: (payload) => apiPost(`/admin/assets/${assetId}/costs/items`, payload, AssetCostItemSchema),
    createRecord: (payload) => apiPost(`/admin/assets/${assetId}/costs`, payload, ObligationDetailSchema),
    approveEntry: (entryId) => apiPost(`/admin/cost-entries/${entryId}/approve`, {}, AssetCostEventSchema),
  };

  return useMutation({
    mutationFn: ({ plan, progress }: { plan: AddCostPlan; progress: AddCostProgress }) =>
      runAddCost(api, plan, progress),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.costItems(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costObligations(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costCoverage(assetId) });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability'] });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability-drilldown'] });
    },
  });
}

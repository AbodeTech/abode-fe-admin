'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { type AddCostPlan } from '../schemas/add-cost.schema';
import { ObligationDetailSchema } from '../schemas/asset-cost.schema';
import { assetKeys } from './query-keys';

/**
 * Sends the whole Add cost action once. The backend transaction creates a
 * new category when needed, the record, its opening amount and its approval.
 */
export function useAddCost(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: AddCostPlan) =>
      apiPost(
        `/admin/assets/${assetId}/costs${plan.approve ? '/create-approved' : ''}`,
        {
          ...plan.record,
          ...(plan.newItem
            ? { new_cost_item: plan.newItem }
            : { cost_item_id: plan.existingItemId }),
        },
        ObligationDetailSchema,
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.costItems(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costObligations(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costSummary(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costCoverage(assetId) });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability'] });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability-drilldown'] });
    },
  });
}

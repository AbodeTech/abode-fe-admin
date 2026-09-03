'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost, isClientError } from '@/lib/api-client';

import {
  FoLandPlanDetailSchema,
  FoPlanActionResultSchema,
  type AllocateFoPlanInput,
} from '../schemas/fo-plan.schema';
import { purchaseKeys } from './query-keys';

/**
 * GET /admin/fo/purchase/payment-plans/:id — land plan with the linked
 * document plan when the BE includes it.
 */
export const useFoLandPlan = (planId: string | null | undefined) =>
  useQuery({
    queryKey: purchaseKeys.foPlan(planId ?? ''),
    queryFn: () =>
      apiGet(`/admin/fo/purchase/payment-plans/${planId}`, FoLandPlanDetailSchema),
    enabled: Boolean(planId),
    retry: (failureCount, error) => !isClientError(error) && failureCount < 3,
  });

function useFoPlanMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
  });
}

/** POST /admin/acquisitions/plans/:planId/suspend — `{ reason }` min 20. */
export const useSuspendFoPlan = () =>
  useFoPlanMutation((args: { id: string; reason: string }) =>
    apiPost(
      `/admin/acquisitions/plans/${args.id}/suspend`,
      { reason: args.reason },
      FoPlanActionResultSchema
    )
  );

/** POST /admin/acquisitions/plans/:planId/unsuspend — empty body; resets default count. */
export const useUnsuspendFoPlan = () =>
  useFoPlanMutation((args: { id: string }) =>
    apiPost(`/admin/acquisitions/plans/${args.id}/unsuspend`, {}, FoPlanActionResultSchema)
  );

/** POST /admin/acquisitions/plans/:planId/allocate — `{ block, plot }`. */
export const useAllocateFoPlan = () =>
  useFoPlanMutation((args: { id: string } & AllocateFoPlanInput) =>
    apiPost(
      `/admin/acquisitions/plans/${args.id}/allocate`,
      { block: args.block, plot: args.plot },
      FoPlanActionResultSchema
    )
  );

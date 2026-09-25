'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch, apiPost } from '@/lib/api-client';

import {
  AssetCostEventSchema,
  type AcceptClaimFormValues,
  type AddStageFormOutput,
  type ApproveEventFormValues,
  type ReverseEventFormValues,
  type UpdateEventFormValues,
} from '../schemas/asset-cost.schema';
import { assetKeys } from './query-keys';

/**
 * Cost events — the stage ledger. Every write here targets one obligation's
 * events (or, for update/approve/reverse, the event directly under
 * `/admin/cost-entries/:eventId` — a top-level route, not nested under
 * assets). All invalidate the owning obligation's detail (which embeds its
 * events — see `ObligationDetailSchema`), the obligations list, coverage,
 * and every profitability read, since a stage change moves the calculation.
 */
function useEventMutation<TVariables, TData>(assetId: string, obligationId: string, mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.costObligation(assetId, obligationId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costObligations(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costCoverage(assetId) });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability'] });
    },
  });
}

/** POST .../costs/:obligationId/stages — 409 `COST_STAGE_DUPLICATE` if this source already wrote this stage. */
export const useAddStage = (assetId: string, obligationId: string) =>
  useEventMutation(assetId, obligationId, (payload: AddStageFormOutput) =>
    apiPost(`/admin/assets/${assetId}/costs/${obligationId}/stages`, payload, AssetCostEventSchema)
  );

/** PATCH /admin/cost-entries/:eventId — only a `draft` event can be edited (409 `COST_EVENT_NOT_DRAFT` otherwise). */
export const useUpdateEvent = (assetId: string, obligationId: string, eventId: string) =>
  useEventMutation(assetId, obligationId, (payload: UpdateEventFormValues) =>
    apiPatch(`/admin/cost-entries/${eventId}`, payload, AssetCostEventSchema)
  );

/** POST /admin/cost-entries/:eventId/approve — the only way a stage counts toward profitability. */
export const useApproveEvent = (assetId: string, obligationId: string, eventId: string) =>
  useEventMutation(assetId, obligationId, (payload: ApproveEventFormValues = {}) =>
    apiPost(`/admin/cost-entries/${eventId}/approve`, payload, AssetCostEventSchema)
  );

/** POST /admin/cost-entries/:eventId/reverse — only an `approved` event can be reversed. */
export const useReverseEvent = (assetId: string, obligationId: string, eventId: string) =>
  useEventMutation(assetId, obligationId, (payload: ReverseEventFormValues) =>
    apiPost(`/admin/cost-entries/${eventId}/reverse`, payload, AssetCostEventSchema)
  );

/**
 * POST .../costs/:obligationId/accept-claim — turns a field-submission's
 * approved `claimed` total into a real, counted `incurred` event. 409
 * `COST_NO_CLAIM_TO_ACCEPT` if there's nothing claimed yet, 409
 * `COST_CLAIM_ALREADY_ACCEPTED` if it already has been.
 */
export const useAcceptClaim = (assetId: string, obligationId: string) =>
  useEventMutation(assetId, obligationId, (payload: AcceptClaimFormValues) =>
    apiPost(`/admin/assets/${assetId}/costs/${obligationId}/accept-claim`, payload, AssetCostEventSchema)
  );

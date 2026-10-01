'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPatch, apiPost } from '@/lib/api-client';

import {
  AssetCostObligationSchema,
  ObligationDetailSchema,
  type ArchiveObligationFormValues,
  type CreateObligationFormOutput,
  type ObligationStatus,
} from '../schemas/asset-cost.schema';
import { assetKeys } from './query-keys';

const LIST_LIMIT = 100;

export type ListObligationsFilters = {
  cost_item_id?: string;
  status?: ObligationStatus;
  page?: number;
  limit?: number;
};

/** GET /admin/assets/:assetId/costs — obligations, i.e. "cost records" in the UI's own language. */
export const useCostObligations = (
  assetId: string,
  filters: ListObligationsFilters = {},
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: [...assetKeys.costObligations(assetId), filters] as const,
    queryFn: () =>
      apiGetPaged(`/admin/assets/${assetId}/costs`, AssetCostObligationSchema, {
        params: { page: 1, limit: LIST_LIMIT, ...filters },
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/**
 * GET /admin/assets/:assetId/costs/:obligationId — the obligation bundled
 * with its cost item, per-stage approved sums, and every event ever
 * recorded against it (see `ObligationDetailSchema`'s doc comment — there is
 * no separate events-list endpoint).
 */
export const useCostObligation = (
  assetId: string,
  obligationId: string | null | undefined,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: assetKeys.costObligation(assetId, obligationId ?? ''),
    queryFn: () => apiGet(`/admin/assets/${assetId}/costs/${obligationId}`, ObligationDetailSchema),
    enabled: Boolean(assetId && obligationId) && (options.enabled ?? true),
  });

function useObligationMutation<TVariables, TData>(
  assetId: string,
  obligationId: string | undefined,
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.costObligations(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costCoverage(assetId) });
      if (obligationId) {
        queryClient.invalidateQueries({ queryKey: assetKeys.costObligation(assetId, obligationId) });
      }
    },
  });
}

/**
 * POST /admin/assets/:assetId/costs — create a cost record against an
 * existing cost item, optionally seeding its first stage.
 *
 * Confirmed against the real `createObligation()`'s literal return: it
 * delegates straight to `getObligation()`, so the response is the same rich
 * `{obligation, cost_item, stages, recognised_cost, events}` shape as
 * `GET .../costs/:obligationId` — NOT the bare obligation the list/archive
 * endpoints return. Read the created record from the result's `.obligation`.
 */
export const useCreateObligation = (assetId: string) =>
  useObligationMutation(assetId, undefined, (payload: CreateObligationFormOutput) =>
    apiPost(`/admin/assets/${assetId}/costs`, payload, ObligationDetailSchema)
  );

/** PATCH .../costs/:obligationId/archive — the only way to retire a cost record; always carries a reason. */
export const useArchiveObligation = (assetId: string, obligationId: string) =>
  useObligationMutation(assetId, obligationId, (payload: ArchiveObligationFormValues) =>
    apiPatch(`/admin/assets/${assetId}/costs/${obligationId}/archive`, payload, AssetCostObligationSchema)
  );

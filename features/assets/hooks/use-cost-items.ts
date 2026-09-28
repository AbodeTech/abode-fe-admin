'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-client';

import {
  AllocationRuleHistorySchema,
  AssetCostItemSchema,
  SetAllocationRuleResultSchema,
  type CreateCostItemFormOutput,
  type SetAllocationRuleFormOutput,
  type UpdateCostItemFormValues,
} from '../schemas/asset-cost.schema';
import { assetKeys } from './query-keys';

/**
 * Cost items — the catalogue layer of the real 3-layer model (item →
 * obligation → event). GET .../costs/items has no pagination on the real
 * backend (a plain array), unlike obligations below.
 */
export const useCostItems = (
  assetId: string,
  options: { includeInactive?: boolean; enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: [...assetKeys.costItems(assetId), { includeInactive: options.includeInactive ?? false }] as const,
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/costs/items`, z.array(AssetCostItemSchema), {
        params: options.includeInactive ? { include_inactive: 'true' } : undefined,
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/**
 * GET .../items/:itemId/allocation-rule — every version ever set for this
 * item, not just the current one. Not paginated on the real backend (a plain
 * `{cost_item, rules[]}` object, confirmed against `allocationHistory()`'s
 * own return) — `apiGetPaged` (which expects a `meta`-carrying array
 * envelope) was the wrong client call for this and silently failed to
 * validate every real response.
 */
export const useAllocationRuleHistory = (
  assetId: string,
  itemId: string | null | undefined,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: assetKeys.costItemAllocationRule(assetId, itemId ?? ''),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/costs/items/${itemId}/allocation-rule`, AllocationRuleHistorySchema),
    enabled: Boolean(assetId && itemId) && (options.enabled ?? true),
  });

function useCostItemsMutation<TVariables, TData>(assetId: string, mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.costItems(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costCoverage(assetId) });
    },
  });
}

/** POST .../costs/items. 409 `COST_ITEM_NAME_TAKEN` on a duplicate (asset_id, group, name). */
export const useCreateCostItem = (assetId: string) =>
  useCostItemsMutation(assetId, (payload: CreateCostItemFormOutput) =>
    apiPost(`/admin/assets/${assetId}/costs/items`, payload, AssetCostItemSchema)
  );

/** PATCH .../costs/items/:itemId — item-level fields only; price/stage data lives on obligations/events. */
export const useUpdateCostItem = (assetId: string, itemId: string) =>
  useCostItemsMutation(assetId, (payload: UpdateCostItemFormValues) =>
    apiPatch(`/admin/assets/${assetId}/costs/items/${itemId}`, payload, AssetCostItemSchema)
  );

/** DELETE .../costs/items/:itemId — always a soft-archive (`is_active:false`), never a hard delete. */
export const useArchiveCostItem = (assetId: string) =>
  useCostItemsMutation(assetId, (itemId: string) =>
    apiDelete(`/admin/assets/${assetId}/costs/items/${itemId}`, AssetCostItemSchema)
  );

/**
 * PUT .../items/:itemId/allocation-rule — every save is a new, additive
 * version (no client-side optimistic lock exists on this endpoint).
 */
export const useSetAllocationRule = (assetId: string, itemId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetAllocationRuleFormOutput) =>
      apiPut(`/admin/assets/${assetId}/costs/items/${itemId}/allocation-rule`, payload, SetAllocationRuleResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.costItems(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.costItemAllocationRule(assetId, itemId) });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability'] });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability-matrix'] });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability-drilldown'] });
    },
  });
};

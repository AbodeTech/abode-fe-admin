"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet, apiGetPaged } from "@/lib/api-client";

import {
  RecoveryAssetOptionSchema,
  RecoveryAssetTreeSchema,
  RecoveryDetailSchema,
  RecoveryRowSchema,
  RecoveryStatsSchema,
  type MoveProduct,
} from "../schemas/recovery-window.schema";
import { recoveryKeys, type RecoveryListFilters } from "./query-keys";

export const DEFAULT_RECOVERY_LIMIT = 20;

export function useRecoveryWindows(filters: RecoveryListFilters) {
  return useQuery({
    queryKey: recoveryKeys.list(filters),
    queryFn: () =>
      apiGetPaged("/admin/recovery-windows", RecoveryRowSchema, {
        params: {
          tab: filters.tab,
          search: filters.search.trim() || undefined,
          page: filters.page,
          limit: filters.limit,
        },
      }),
    select: (data) => ({ count: data.meta.total ?? 0, rows: data.items }),
  });
}

export function useRecoveryStats() {
  return useQuery({
    queryKey: recoveryKeys.stats(),
    queryFn: () => apiGet("/admin/recovery-windows/stats", RecoveryStatsSchema),
  });
}

export function useRecoveryWindow(id: string) {
  return useQuery({
    queryKey: recoveryKeys.detail(id),
    queryFn: () => apiGet(`/admin/recovery-windows/${id}`, RecoveryDetailSchema),
    enabled: Boolean(id),
  });
}

/** Estates selling a product, for the Send terms estate picker. */
export function useMoveEstates(type: MoveProduct, enabled = true) {
  return useQuery({
    queryKey: recoveryKeys.assetOptions(type),
    queryFn: () =>
      apiGetPaged("/admin/assets", RecoveryAssetOptionSchema, {
        params: { page: 1, limit: 500, offer_type: type },
      }),
    select: (data) =>
      data.items.filter((asset) =>
        asset.offers.some((offer) => offer.offer_type === type && offer.is_active !== false)
      ),
    enabled,
  });
}

/** One estate's sizes and list prices, for the size picker and the defaults. */
export function useMoveEstateTree(assetId: string) {
  return useQuery({
    queryKey: recoveryKeys.assetTree(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}`, RecoveryAssetTreeSchema),
    enabled: Boolean(assetId),
  });
}

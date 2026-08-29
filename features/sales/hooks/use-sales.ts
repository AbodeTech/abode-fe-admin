'use client';

import { useQueries, useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import {
  SALES_PLAN_STATUSES,
  SalesDashboardResponseSchema,
  SalesRowSchema,
  type SalesPlanStatus,
} from '../schemas/sales.schema';
import { salesKeys } from './query-keys';

/**
 * Mirrors `SalesQueryDto` — the BE runs `forbidNonWhitelisted`, so a param
 * this DTO doesn't declare is a hard 400. Confirmed against
 * `dto/sales-query.dto.ts` on `origin/staging` (2026-08-29). Only a subset
 * is wired to UI controls today; the rest are here so the type is a true
 * contract and future filter UI doesn't need to guess param names.
 */
export interface SalesListFilters {
  page?: number;
  limit?: number;

  createdStartDate?: string | null;
  createdEndDate?: string | null;
  startStartDate?: string | null;
  startEndDate?: string | null;
  nextPaymentStartDate?: string | null;
  nextPaymentEndDate?: string | null;
  allocationStartDate?: string | null;
  allocationEndDate?: string | null;

  assetType?: string | null;
  sourceType?: string | null;
  assetId?: string | null;
  assetLocation?: string | null;
  buyerUserId?: string | null;
  referrerUserId?: string | null;
  agencyId?: string | null;

  planStatus?: SalesPlanStatus | null;
  allocationStatus?: string | null;
  isDefaulted?: boolean | null;
  isSuspended?: boolean | null;
  hasDefaultedEver?: boolean | null;
  hasReferrer?: boolean | null;
  hasAgency?: boolean | null;
  createdByAdmin?: boolean | null;
  originatedFromCloseRelocate?: boolean | null;

  q?: string | null;
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc' | null;

  [key: string]: unknown;
}

export const DEFAULT_SALES_LIMIT = 25;

export function buildSalesListParams(filters: SalesListFilters) {
  return {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_SALES_LIMIT,
    created_start_date: filters.createdStartDate || undefined,
    created_end_date: filters.createdEndDate || undefined,
    start_start_date: filters.startStartDate || undefined,
    start_end_date: filters.startEndDate || undefined,
    next_payment_start_date: filters.nextPaymentStartDate || undefined,
    next_payment_end_date: filters.nextPaymentEndDate || undefined,
    allocation_start_date: filters.allocationStartDate || undefined,
    allocation_end_date: filters.allocationEndDate || undefined,
    asset_type: filters.assetType || undefined,
    source_type: filters.sourceType || undefined,
    asset_id: filters.assetId || undefined,
    asset_location: filters.assetLocation || undefined,
    buyer_user_id: filters.buyerUserId || undefined,
    referrer_user_id: filters.referrerUserId || undefined,
    agency_id: filters.agencyId || undefined,
    plan_status: filters.planStatus || undefined,
    allocation_status: filters.allocationStatus || undefined,
    is_defaulted: filters.isDefaulted ?? undefined,
    is_suspended: filters.isSuspended ?? undefined,
    has_defaulted_ever: filters.hasDefaultedEver ?? undefined,
    has_referrer: filters.hasReferrer ?? undefined,
    has_agency: filters.hasAgency ?? undefined,
    created_by_admin: filters.createdByAdmin ?? undefined,
    originated_from_close_relocate: filters.originatedFromCloseRelocate ?? undefined,
    q: filters.q || undefined,
    sort_by: filters.sortBy || undefined,
    sort_dir: filters.sortDir || undefined,
  };
}

/**
 * GET /admin/sales — every plan across flex/full-ownership/commercial/
 * developer-plot, plus marketplace resales unioned in. `view_sales`.
 */
export const useSalesList = (filters: SalesListFilters) => {
  return useQuery({
    queryKey: salesKeys.list(filters),
    queryFn: () => apiGetPaged('/admin/sales', SalesRowSchema, { params: buildSalesListParams(filters) }),
  });
};

/**
 * GET /admin/sales/dashboard — 4-card summary (Overall/Flex/Full-Ownership/
 * Commercial), 5-min server-cached per date range. `view_sales`.
 */
export const useSalesDashboard = (filters?: { startDate?: string | null; endDate?: string | null }) => {
  const startDate = filters?.startDate || undefined;
  const endDate = filters?.endDate || undefined;

  return useQuery({
    queryKey: salesKeys.dashboard({ startDate, endDate }),
    queryFn: () =>
      apiGet('/admin/sales/dashboard', SalesDashboardResponseSchema, {
        params: { start_date: startDate, end_date: endDate },
      }),
  });
};

export interface SalesPlanStatusCounts {
  total: number;
  counts: Record<SalesPlanStatus, number>;
}

/**
 * Cheap per-status row counts for the status chips — five `limit: 1` list
 * requests read off `meta.total`, rather than pulling every matching row
 * client-side to bucket them by hand (the exact in-memory-filter pattern the
 * BE's own design doc calls out as a v1 performance bug, just on the FE side
 * instead — see the Sales Module v2 doc, S-7/S-8).
 */
export const useSalesPlanStatusCounts = (
  filters: Pick<
    SalesListFilters,
    'q' | 'createdStartDate' | 'createdEndDate' | 'assetType' | 'sourceType'
  >
) => {
  const base = { ...filters, page: 1, limit: 1 };

  const results = useQueries({
    queries: SALES_PLAN_STATUSES.map((status) => ({
      queryKey: salesKeys.planStatusCounts({ ...filters, planStatus: status }),
      queryFn: () =>
        apiGetPaged('/admin/sales', SalesRowSchema, {
          params: buildSalesListParams({ ...base, planStatus: status }),
        }),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error ?? null;

  const data: SalesPlanStatusCounts | undefined = results.every((r) => r.data)
    ? (() => {
        const counts = {} as Record<SalesPlanStatus, number>;
        let total = 0;
        SALES_PLAN_STATUSES.forEach((status, i) => {
          const count = results[i].data?.meta.total ?? 0;
          counts[status] = count;
          total += count;
        });
        return { total, counts };
      })()
    : undefined;

  return { data, isLoading, error };
};

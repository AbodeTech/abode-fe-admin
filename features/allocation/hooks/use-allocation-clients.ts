'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { AllocationClientSchema, type AllocationStatus } from '../schemas/allocation.schema';
import { allocationKeys } from './query-keys';

/**
 * Mirrors `EligibleClientsQueryDto` exactly — the BE runs `forbidNonWhitelisted`,
 * so a param this DTO doesn't declare is a hard 400, not a silently-ignored
 * extra. Confirmed against `dto/allocation.dto.ts` on `origin/staging`
 * (2026-08-28).
 */
export interface AllocationClientFilters {
  page?: number;
  limit?: number;
  /** Preferred filter — an asset's `_id`. */
  assetId?: string | null;
  /** Legacy composite fallback (regex on `asset.name`) — prefer `assetId`. */
  assetName?: string | null;
  assetType?: string | null;
  allocationStatus?: AllocationStatus | null;
  /** `$gte` only — there is no upper-bound param on this endpoint. */
  paymentPercentageMin?: number | null;
  /** Regex over the client's firstName/lastName/email/phoneNumber — not asset name. */
  search?: string | null;
  /** Filters on the plan's `createdAt`, inclusive. */
  dateFrom?: string | null;
  dateTo?: string | null;
  /**
   * Filters `payment_completed_date`, independent of `dateFrom`/`dateTo` —
   * the two can be combined. Either bound alone is enough, and passing either
   * also **excludes plans still paying**, since a date range never matches the
   * null the BE returns for them: it doubles as "only clients who have
   * completed".
   */
  completedFrom?: string | null;
  completedTo?: string | null;
  /** `payment_completed_date` is a valid key — it maps straight to a pipeline field. */
  sortBy?: string | null;
  order?: 'asc' | 'desc' | null;
  [key: string]: unknown;
}

export const DEFAULT_ALLOCATION_LIMIT = 25;

/**
 * Everything except `page`/`limit`, which is exactly what the BE's `toFilters`
 * reads. Shared with the CSV export so the file always covers what the table
 * is showing — the export runs the same pipeline over the whole filtered set.
 */
export function buildEligibleClientsParams(filters: AllocationClientFilters) {
  return {
    asset_id: filters.assetId || undefined,
    asset_name: filters.assetName || undefined,
    asset_type: filters.assetType || undefined,
    allocation_status: filters.allocationStatus || undefined,
    payment_percentage_min: filters.paymentPercentageMin ?? undefined,
    search: filters.search || undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    completed_from: filters.completedFrom || undefined,
    completed_to: filters.completedTo || undefined,
    sort_by: filters.sortBy || undefined,
    order: filters.order || undefined,
  };
}

/**
 * GET /admin/allocation/eligible-clients — clients qualified for a plot
 * allocation, one row per eligible payment plan (a client with several
 * plans gets several rows). Response shape confirmed live 2026-08-28;
 * filters confirmed by reading `EligibleClientsQueryDto` +
 * `eligibleClientsPipeline()` in `allocation.repository.ts` on
 * `origin/staging` (not yet deployed to this app's target environment).
 */
export const useAllocationClients = (filters: AllocationClientFilters) => {
  const { page = 1, limit = DEFAULT_ALLOCATION_LIMIT } = filters;

  return useQuery({
    queryKey: allocationKeys.list(filters),
    queryFn: () =>
      apiGetPaged('/admin/allocation/eligible-clients', AllocationClientSchema, {
        params: { page, limit, ...buildEligibleClientsParams(filters) },
      }),
  });
};

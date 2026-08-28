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
  sortBy?: string | null;
  order?: 'asc' | 'desc' | null;
  [key: string]: unknown;
}

export const DEFAULT_ALLOCATION_LIMIT = 25;

/**
 * GET /admin/allocation/eligible-clients — clients qualified for a plot
 * allocation, one row per eligible payment plan (a client with several
 * plans gets several rows). Response shape confirmed live 2026-08-28;
 * filters confirmed by reading `EligibleClientsQueryDto` +
 * `eligibleClientsPipeline()` in `allocation.repository.ts` on
 * `origin/staging` (not yet deployed to this app's target environment).
 */
export const useAllocationClients = (filters: AllocationClientFilters) => {
  const {
    page = 1,
    limit = DEFAULT_ALLOCATION_LIMIT,
    assetId,
    assetName,
    assetType,
    allocationStatus,
    paymentPercentageMin,
    search,
    dateFrom,
    dateTo,
    sortBy,
    order,
  } = filters;

  return useQuery({
    queryKey: allocationKeys.list(filters),
    queryFn: () =>
      apiGetPaged('/admin/allocation/eligible-clients', AllocationClientSchema, {
        params: {
          page,
          limit,
          asset_id: assetId || undefined,
          asset_name: assetName || undefined,
          asset_type: assetType || undefined,
          allocation_status: allocationStatus || undefined,
          payment_percentage_min: paymentPercentageMin ?? undefined,
          search: search || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          sort_by: sortBy || undefined,
          order: order || undefined,
        },
      }),
  });
};

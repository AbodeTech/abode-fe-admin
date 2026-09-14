'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';
/**
 * Reaching into features/sales, deliberately.
 *
 * `listForManager` on the BE delegates to the very same `SalesService.list`
 * that backs `/admin/sales` — a manager's sales record IS the sales list with
 * the roster as a referrer filter. Cloning the row schema and the query builder
 * here would produce two descriptions of one wire shape, and they would drift
 * the first time the sales module gains a column. The self-contained-feature
 * rule buys isolation; there is none to buy when the bytes are identical.
 */
import { buildSalesListParams, type SalesListFilters } from '@/features/sales/hooks/use-sales';
import { SalesRowSchema } from '@/features/sales/schemas/sales.schema';

import { managerKeys } from './query-keys';

export interface UseTeamSalesParams {
  page?: number;
  limit?: number;
  filters?: SalesListFilters | null;
  /** MPT-ADD-5 — drop abandoned pros from the scoped roster. */
  activeProsOnly?: boolean;
  enabled?: boolean;
}

export const DEFAULT_TEAM_SALES_LIMIT = 25;

const params = ({ page, limit, filters, activeProsOnly }: Required<
  Pick<UseTeamSalesParams, 'page' | 'limit'>
> & { filters: SalesListFilters | null; activeProsOnly?: boolean }) => ({
  ...buildSalesListParams(filters ?? {}),
  page,
  limit,
  // Only sent when true: the BE runs `forbidNonWhitelisted`, and an explicit
  // `false` is the same as absent to it, so omitting keeps the URL honest.
  active_pros_only: activeProsOnly ? true : undefined,
});

/**
 * GET /admin/managers/sales-record — the signed-in manager's own team.
 *
 * Guarded by IsManagerGuard, so an admin who is not a manager gets a 403 rather
 * than an empty list. Callers that might not be a manager should pass
 * `enabled: false` instead of firing and catching.
 */
export const useManagerTeamSales = (opts: UseTeamSalesParams = {}) => {
  const {
    page = 1,
    limit = DEFAULT_TEAM_SALES_LIMIT,
    filters = null,
    activeProsOnly,
    enabled = true,
  } = opts;

  return useQuery({
    queryKey: managerKeys.teamSalesSelf({ page, limit, filters, activeProsOnly }),
    queryFn: () =>
      apiGetPaged('/admin/managers/sales-record', SalesRowSchema, {
        params: params({ page, limit, filters, activeProsOnly }),
      }),
    enabled,
  });
};

/** GET /admin/managers/:manager_id/sales-record — any manager's roster. */
export const useAdminManagerTeamSales = (
  managerId: string | null,
  opts: UseTeamSalesParams = {}
) => {
  const {
    page = 1,
    limit = DEFAULT_TEAM_SALES_LIMIT,
    filters = null,
    activeProsOnly,
    enabled = true,
  } = opts;

  return useQuery({
    queryKey: managerKeys.teamSalesAdmin(managerId ?? '', {
      page,
      limit,
      filters,
      activeProsOnly,
    }),
    queryFn: () =>
      apiGetPaged(`/admin/managers/${managerId}/sales-record`, SalesRowSchema, {
        params: params({ page, limit, filters, activeProsOnly }),
      }),
    enabled: enabled && Boolean(managerId),
  });
};

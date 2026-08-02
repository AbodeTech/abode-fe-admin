'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { PurchaseSchema } from '../schemas/purchase.schema';
import { purchaseKeys, type PurchaseListFilters } from './query-keys';

/** The BE defaults to 20; kept explicit so the pagination maths agree. */
export const DEFAULT_PURCHASE_LIMIT = 20;

/**
 * GET /admin/transactions?type=purchase — every asset purchase, flex and
 * (once the backend builds it) full-ownership, newest first.
 *
 * The endpoint's whole filter surface is type/status/user — no search, no
 * date range, no kind or payment-method params, and no populate. The page
 * renders the old screen's richer filters disabled rather than dropping
 * them; the gaps are recorded in docs/BACKEND-REQUESTS.md.
 */
export const usePurchases = (filters?: PurchaseListFilters) => {
  const { page = 1, limit = DEFAULT_PURCHASE_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: purchaseKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/transactions', PurchaseSchema, {
        params: {
          type: 'purchase',
          page,
          limit,
          status: rest.status,
          user: rest.user,
        },
      }),
  });
};

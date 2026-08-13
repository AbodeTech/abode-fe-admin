'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { PurchaseSchema } from '../schemas/purchase.schema';
import { purchaseKeys, type PurchaseListFilters } from './query-keys';

/** The BE defaults to 20; kept explicit so the pagination maths agree. */
export const DEFAULT_PURCHASE_LIMIT = 20;

/**
 * GET /admin/transactions?type=purchase — every asset purchase, flex and
 * full-ownership, newest first.
 *
 * All filtering is server-side (ticket 24d, landed 2026-08-13). Two notes on
 * the params:
 *
 * - `search` matches the **asset's** name or location **or** the payer. It is
 *   the only search in this app that crosses collections, so an empty result
 *   genuinely means neither side matched.
 * - `sales_type` and `asset_type` both narrow `purchase_details.transaction_kind`
 *   and the BE intersects them, so `dp` + `flex` correctly returns nothing —
 *   flex has no document payments.
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
          search: rest.search || undefined,
          status: rest.status,
          payment_method: rest.payment_method,
          sales_type: rest.sales_type,
          asset_type: rest.asset_type,
          start_date: rest.start_date,
          end_date: rest.end_date,
          user: rest.user,
        },
      }),
  });
};

'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { PurchaseSchema } from '../schemas/purchase.schema';
import { purchaseKeys, type DocumentPurchaseListFilters } from './query-keys';

/** Matches production pagination (10 rows per page). */
export const DEFAULT_DOCUMENT_PURCHASE_LIMIT = 10;

/**
 * GET /admin/transactions/documents — the document / development-levy ledger.
 *
 * Its own endpoint, not `?sales_type=dp` on the asset list: the BE keeps
 * document fees in a separate ledger (`purchase_kind: 'dev_levy'`) precisely
 * so the admin screens never mix them into asset sales. Rows are ordinary
 * purchase Transactions, so they parse with the same `PurchaseSchema` and
 * review through the same approve/decline pair.
 *
 * There is no `sales_type` param — every row here is already a document
 * payment — and no `type`, since the path itself scopes the query.
 */
export const useDocumentPurchases = (filters?: DocumentPurchaseListFilters) => {
  const { page = 1, limit = DEFAULT_DOCUMENT_PURCHASE_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: purchaseKeys.documentList({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/transactions/documents', PurchaseSchema, {
        params: {
          page,
          limit,
          search: rest.search || undefined,
          status: rest.status,
          payment_method: rest.payment_method,
          asset_type: rest.asset_type,
          start_date: rest.start_date,
          end_date: rest.end_date,
          user: rest.user,
        },
      }),
  });
};

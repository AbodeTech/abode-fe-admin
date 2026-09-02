'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { PurchaseSchema, type Purchase } from '../schemas/purchase.schema';
import { purchaseKeys, type DocumentPurchaseListFilters } from './query-keys';

/**
 * The document ledger has no CSV endpoint on the BE (unlike commission, which
 * streams one), so the export is one wide page of the same list the screen is
 * showing, turned into a file client-side.
 *
 * Two deliberate differences from the v1 GraphQL export it replaces:
 *
 * - It exports what the current filters describe, not just the pending rows.
 *   v1 hard-filtered to `admin_status === 'pending'`, which silently produced
 *   an empty file whenever the admin had filtered to approved or declined.
 * - Phone number and referral status are gone. The BE populates the buyer with
 *   `firstName lastName email referred_by` only, so those two columns could
 *   only ever have been "N/A".
 */
export const DOCUMENT_EXPORT_LIMIT = 10_000;

export const useDocumentPurchaseExport = () =>
  useMutation({
    mutationKey: [...purchaseKeys.documents(), 'export'],
    mutationFn: async (filters: DocumentPurchaseListFilters): Promise<Purchase[]> => {
      const { items } = await apiGetPaged('/admin/transactions/documents', PurchaseSchema, {
        params: {
          page: 1,
          limit: DOCUMENT_EXPORT_LIMIT,
          search: filters.search || undefined,
          status: filters.status,
          payment_method: filters.payment_method,
          asset_type: filters.asset_type,
          start_date: filters.start_date,
          end_date: filters.end_date,
          user: filters.user,
        },
      });
      return items;
    },
  });

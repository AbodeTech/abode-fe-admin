'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  AssetTransactionStatsSchema,
  DocumentTransactionStatsSchema,
  type DocumentStatsFilters,
} from '../schemas/purchase.schema';
import { purchaseKeys, type PurchaseListFilters } from './query-keys';

/**
 * GET /admin/transactions/stats — the asset transaction stat cards.
 *
 * Takes the SAME filters as the table and applies them identically, so pass
 * the page's live filters: the cards are meant to describe the rows below
 * them. Pagination is the only thing dropped — a summary has no pages.
 *
 * A failed aggregation returns 500 with a correlation id; the strip is hidden
 * rather than retried, leaving the table untouched.
 */
export const usePurchaseStats = (filters?: Omit<PurchaseListFilters, 'page' | 'limit'>) =>
  useQuery({
    queryKey: [...purchaseKeys.all, 'stats', filters ?? {}] as const,
    queryFn: () =>
      apiGet('/admin/transactions/stats', AssetTransactionStatsSchema, {
        params: {
          type: 'purchase',
          search: filters?.search || undefined,
          status: filters?.status,
          payment_method: filters?.payment_method,
          sales_type: filters?.sales_type,
          asset_type: filters?.asset_type,
          start_date: filters?.start_date,
          end_date: filters?.end_date,
          user: filters?.user,
        },
      }),
    retry: false,
    staleTime: 60 * 1000,
  });

/**
 * GET /admin/transactions/documents/stats — the document ledger's cards.
 *
 * Global, unlike the asset stats: a date range is the only filter it accepts,
 * so these numbers describe every document payment rather than the filtered
 * table beneath them.
 */
export const useDocumentPurchaseStats = (filters?: DocumentStatsFilters) =>
  useQuery({
    queryKey: [...purchaseKeys.documents(), 'stats', filters ?? {}] as const,
    queryFn: () =>
      apiGet('/admin/transactions/documents/stats', DocumentTransactionStatsSchema, {
        params: {
          start_date: filters?.start_date || undefined,
          end_date: filters?.end_date || undefined,
        },
      }),
    retry: false,
    staleTime: 60 * 1000,
  });

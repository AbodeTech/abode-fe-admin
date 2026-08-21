'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { CommissionTransactionRowSchema } from '../schemas/commission-transaction.schema';
import { transactionKeys } from './query-keys';

/** BE default 25, max 100. */
export const DEFAULT_COMMISSION_TRANSACTIONS_LIMIT = 25;

const COMMISSION_SOURCE_TYPES = new Set([
  'direct',
  'upline',
  'topline',
  'agency',
  'founder',
  'wht',
]);

export type CommissionTransactionsFilters = {
  page?: number;
  limit?: number;
  /** Maps to BE `from` — page uses `start_date` query param. */
  from?: string | null;
  /** Maps to BE `to` — page uses `end_date` query param. */
  to?: string | null;
  source_type?: string | null;
  q?: string | null;
  referrer_id?: string | null;
  source_user?: string | null;
  source_asset?: string | null;
  override_source?: string | null;
  tier_at_creation?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  sort_by?: 'createdAt' | 'net_commission' | 'gross_commission' | null;
  sort_dir?: 'asc' | 'desc' | null;
};

/**
 * GET /admin/commission/transactions — the commission ledger.
 *
 * Standard paged envelope (`data[]` + `meta`). Query mirrors
 * `CommissionTransactionQueryDto` (same filters as the CSV export).
 */
export const useCommissionTransactions = (filters?: CommissionTransactionsFilters) => {
  const {
    page = 1,
    limit = DEFAULT_COMMISSION_TRANSACTIONS_LIMIT,
    from = null,
    to = null,
    source_type = null,
    q = null,
    referrer_id = null,
    source_user = null,
    source_asset = null,
    override_source = null,
    tier_at_creation = null,
    min_amount = null,
    max_amount = null,
    sort_by = null,
    sort_dir = null,
  } = filters ?? {};

  const sourceType =
    source_type && COMMISSION_SOURCE_TYPES.has(source_type) ? source_type : undefined;

  return useQuery({
    queryKey: transactionKeys.commissionList({
      page,
      limit,
      from,
      to,
      source_type: sourceType ?? null,
      q,
      sort_by,
      sort_dir,
    }),
    queryFn: () =>
      apiGetPaged('/admin/commission/transactions', CommissionTransactionRowSchema, {
        params: {
          page,
          limit,
          from: from || undefined,
          to: to || undefined,
          source_type: sourceType,
          q: q || undefined,
          referrer_id: referrer_id || undefined,
          source_user: source_user || undefined,
          source_asset: source_asset || undefined,
          override_source: override_source || undefined,
          tier_at_creation: tier_at_creation || undefined,
          min_amount: min_amount ?? undefined,
          max_amount: max_amount ?? undefined,
          sort_by: sort_by || undefined,
          sort_dir: sort_dir || undefined,
        },
      }),
  });
};

export type CommissionTransactionsData = NonNullable<
  ReturnType<typeof useCommissionTransactions>['data']
>;

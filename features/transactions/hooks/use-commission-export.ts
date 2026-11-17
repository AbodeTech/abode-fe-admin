import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';
import { exportToCsv, type CsvColumn } from '@/lib/utils/export-csv';

import { CommissionTransactionRowSchema, type CommissionTransactionRow } from '../schemas/commission-transaction.schema';

import { transactionKeys } from './query-keys';

/* ============================================================
 * GET /admin/commission/transactions/export
 *
 * Exports the filtered ledger with the admin's requested column order.
 *
 * Query mirrors CommissionTransactionQueryDto: from, to, source_type, q, …
 * ============================================================ */

const COMMISSION_SOURCE_TYPES = new Set([
  'direct',
  'upline',
  'topline',
  'agency',
  'founder',
  'wht',
]);

export type CommissionExportParams = {
  from?: string | null;
  to?: string | null;
  /** Prefer BE `source_type` (direct/upline/…). Legacy page filter may pass flex/FO. */
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

const EXPORT_LIMIT = 100;
const MAX_EXPORT_ROWS = 50_000;
const COLUMNS: CsvColumn<CommissionTransactionRow>[] = [
  { header: 'Date', accessor: (row) => row.created_at },
  { header: 'Client_name', accessor: (row) => row.source_user_name ?? '' },
  { header: 'Transaction_amount', accessor: (row) => row.transaction_amount ?? '' },
  { header: 'Asset_type', accessor: (row) => row.asset_type ?? '' },
  { header: 'Associate_name', accessor: (row) => row.referrer_name ?? '' },
  { header: 'Associate_status', accessor: (row) => row.associate_status ?? row.tier_at_creation ?? '' },
  { header: 'Percentage_earned', accessor: (row) => row.rate_applied == null ? '' : row.rate_applied * 100 },
  { header: 'Commission', accessor: (row) => row.gross_commission ?? '' },
  { header: 'Tax_Payer_ID', accessor: (row) => row.referrer_tin ?? '' },
  { header: 'WHT_tax', accessor: (row) => row.wht_deducted ?? '' },
  { header: 'Comission_earned', accessor: (row) => row.net_commission ?? '' },
  { header: 'Commission_status', accessor: (row) => row.status },
];

export const useCommissionExport = () =>
  useMutation({
    mutationKey: [...transactionKeys.all, 'commission-export'],
    mutationFn: async (params: CommissionExportParams) => {
      const sourceType =
        params.source_type && COMMISSION_SOURCE_TYPES.has(params.source_type)
          ? params.source_type
          : undefined;

      const rows: CommissionTransactionRow[] = [];
      for (let page = 1; rows.length < MAX_EXPORT_ROWS; page += 1) {
        const { items, meta } = await apiGetPaged('/admin/commission/transactions', CommissionTransactionRowSchema, {
          params: {
            page,
            limit: EXPORT_LIMIT,
          from: params.from || undefined,
          to: params.to || undefined,
          source_type: sourceType,
          q: params.q || undefined,
          referrer_id: params.referrer_id || undefined,
          source_user: params.source_user || undefined,
          source_asset: params.source_asset || undefined,
          override_source: params.override_source || undefined,
          tier_at_creation: params.tier_at_creation || undefined,
          min_amount: params.min_amount ?? undefined,
          max_amount: params.max_amount ?? undefined,
          sort_by: params.sort_by || undefined,
          sort_dir: params.sort_dir || undefined,
          },
        });
        rows.push(...items);
        if (items.length < EXPORT_LIMIT || (meta.total != null && rows.length >= meta.total)) break;
      }

      const filename = `commission-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      exportToCsv(rows.slice(0, MAX_EXPORT_ROWS), COLUMNS, filename);

      return { filename, truncated: rows.length >= MAX_EXPORT_ROWS };
    },
  });

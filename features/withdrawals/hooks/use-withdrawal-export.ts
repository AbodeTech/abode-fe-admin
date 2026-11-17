'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';
import { exportToCsv, type CsvColumn } from '@/lib/utils/export-csv';

import {
  ADMIN_STATUS_LABELS,
  WithdrawalSchema,
  bankAccountNumber,
  bankName,
  personEmail,
  personName,
  type Withdrawal,
} from '../schemas/withdrawal.schema';
import type { WithdrawalListFilters } from './query-keys';

/* ============================================================
 * CSV export for the withdrawal queue.
 *
 * Client-side by decision (see REST-ENDPOINT-MAP.md): page the list endpoint we
 * already call and write the file in the browser, so every value in the CSV is a
 * row we hold.
 *
 * The loop is capped and the result says whether it stopped short. That matters
 * more here than anywhere else in the app — this file is what someone reconciles
 * real bank transfers against, and a short file that looks complete would read
 * as "these are all the payouts".
 * ============================================================ */

const EXPORT_PAGE_SIZE = 100;

/** 50 × 100 = 5,000 rows. Past that, ask for a server-side export. */
const MAX_PAGES = 50;

const COLUMNS: CsvColumn<Withdrawal>[] = [
  { header: 'date', accessor: (row) => row.createdAt ?? '' },
  { header: 'name', accessor: (row) => personName(row.user) ?? '' },
  { header: 'email', accessor: (row) => personEmail(row.user) ?? '' },
  { header: 'phone_number', accessor: (row) => (typeof row.user === 'object' ? row.user.phoneNumber ?? '' : '') },
  { header: 'status', accessor: (row) => ADMIN_STATUS_LABELS[row.admin_status ?? 'pending'] },
  { header: 'referrer', accessor: (row) => personName(row.referrer) ?? '' },
  { header: 'amount', accessor: (row) => row.amount },
  { header: 'bank_name', accessor: (row) => bankName(row.bank_details_id) ?? '' },
  { header: 'account_number', accessor: (row) => bankAccountNumber(row.bank_details_id) ?? '' },
];

export type WithdrawalExportResult = {
  rows: number;
  total: number | null;
  truncated: boolean;
};

async function fetchAllWithdrawals(filters: WithdrawalListFilters) {
  const rows: Withdrawal[] = [];
  let total: number | null = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { items, meta } = await apiGetPaged('/admin/withdrawals', WithdrawalSchema, {
      params: {
        page,
        limit: EXPORT_PAGE_SIZE,
        search: filters.search || undefined,
        admin_status: filters.admin_status,
        payment_provider: filters.payment_provider,
      },
    });

    if (meta.total != null) total = meta.total;
    rows.push(...items);

    if (items.length < EXPORT_PAGE_SIZE) {
      return { rows, total, truncated: false };
    }
  }

  return { rows, total, truncated: total == null || rows.length < total };
}

export const useWithdrawalExport = () =>
  useMutation<WithdrawalExportResult, Error, WithdrawalListFilters | undefined>({
    mutationFn: async (filters) => {
      const { rows, total, truncated } = await fetchAllWithdrawals(filters ?? {});

      if (rows.length > 0) {
        const stamp = new Date().toISOString().slice(0, 10);
        exportToCsv(rows, COLUMNS, `withdrawals-${stamp}.csv`);
      }

      return { rows: rows.length, total, truncated };
    },
  });

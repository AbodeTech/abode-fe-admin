'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';
import { exportToCsv, type CsvColumn } from '@/lib/utils/export-csv';

import {
  ADMIN_STATUS_LABELS,
  KYC_STATE_LABELS,
  PAYMENT_PROVIDER_LABELS,
  TRANSACTION_STATUS_LABELS,
  WithdrawalSchema,
  bankAccountName,
  bankAccountNumber,
  bankDetailsId,
  bankName,
  personEmail,
  personId,
  personName,
  personTin,
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
  { header: 'Requested', accessor: (row) => row.createdAt ?? '' },
  { header: 'Requested by', accessor: (row) => personName(row.user) ?? '' },
  { header: 'Email', accessor: (row) => personEmail(row.user) ?? '' },
  { header: 'User ID', accessor: (row) => personId(row.user) ?? '' },
  { header: 'TIN', accessor: (row) => personTin(row.user)?.value ?? '' },
  {
    // The verification state travels with the number — a reconciliation file
    // that showed the TIN alone would present an unchecked one as fact.
    header: 'TIN status',
    accessor: (row) => {
      const state = personTin(row.user)?.state;
      return state ? KYC_STATE_LABELS[state] : '';
    },
  },
  { header: 'Bank', accessor: (row) => bankName(row.bank_details_id) ?? '' },
  { header: 'Account number', accessor: (row) => bankAccountNumber(row.bank_details_id) ?? '' },
  { header: 'Account name', accessor: (row) => bankAccountName(row.bank_details_id) ?? '' },
  { header: 'Bank details ID', accessor: (row) => bankDetailsId(row.bank_details_id) ?? '' },
  { header: 'Amount (NGN)', accessor: (row) => row.amount },
  { header: 'Fee (NGN)', accessor: (row) => row.fee_amount ?? '' },
  { header: 'Total debited (NGN)', accessor: (row) => row.total_debited ?? '' },
  {
    header: 'Review status',
    accessor: (row) => ADMIN_STATUS_LABELS[row.admin_status ?? 'pending'],
  },
  { header: 'Money status', accessor: (row) => TRANSACTION_STATUS_LABELS[row.status] },
  { header: 'Method', accessor: (row) => row.processing_type ?? '' },
  {
    header: 'Provider',
    accessor: (row) => (row.payment_provider ? PAYMENT_PROVIDER_LABELS[row.payment_provider] : ''),
  },
  { header: 'Transfer reference', accessor: (row) => row.provider_transfer_reference ?? '' },
  { header: 'Failed attempts', accessor: (row) => row.rail_attempts.length },
  {
    header: 'Last rail error',
    accessor: (row) => row.rail_attempts[row.rail_attempts.length - 1]?.error.message ?? '',
  },
  { header: 'Withdrawal reason', accessor: (row) => row.withdrawal_reason ?? '' },
  { header: 'Decline reason', accessor: (row) => row.decline_reason ?? '' },
  { header: 'Reviewed at', accessor: (row) => row.reviewed_at ?? '' },
  { header: 'Reviewed by', accessor: (row) => personName(row.reviewed_by) ?? '' },
  { header: 'Transaction ID', accessor: (row) => row._id },
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

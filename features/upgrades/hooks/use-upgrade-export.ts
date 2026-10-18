'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';
import { exportToCsv, type CsvColumn } from '@/lib/utils/export-csv';

import {
  UPGRADE_PAYMENT_METHOD_LABELS,
  UPGRADE_STATUS_LABELS,
  USER_TIER_LABELS,
  UpgradeSchema,
  personEmail,
  personId,
  personName,
  personPhone,
  type Upgrade,
} from '../schemas/upgrade.schema';
import type { UpgradeListFilters } from './query-keys';

/* ============================================================
 * CSV export for the upgrade queue.
 *
 * The BE has no export endpoint, and per the decision recorded in
 * REST-ENDPOINT-MAP.md exports stay client-side: page the list endpoint we
 * already call and write the file in the browser. Every value in the CSV is a
 * row we actually hold.
 *
 * The loop is capped. A truncated file that looks complete is the failure mode
 * to avoid here — an admin reconciling payments would be reading a subset as if
 * it were the whole queue — so the result reports whether it stopped short and
 * the caller says so out loud.
 * ============================================================ */

/** The BE caps `limit` at 100 (`@Max(100)` on `UpgradeQueryDto`). */
const EXPORT_PAGE_SIZE = 100;

/** 50 × 100 = 5,000 rows. Past that, ask for a server-side export. */
const MAX_PAGES = 50;

const COLUMNS: CsvColumn<Upgrade>[] = [
  { header: 'Requested', accessor: (row) => row.createdAt ?? '' },
  { header: 'Applicant', accessor: (row) => personName(row.user) ?? '' },
  { header: 'Applicant email', accessor: (row) => personEmail(row.user) ?? '' },
  { header: 'Applicant phone', accessor: (row) => personPhone(row.user) ?? '' },
  { header: 'Applicant ID', accessor: (row) => personId(row.user) ?? '' },
  { header: 'Referrer', accessor: (row) => personName(row.referrer) ?? '' },
  { header: 'Referrer email', accessor: (row) => personEmail(row.referrer) ?? '' },
  { header: 'Referrer phone', accessor: (row) => personPhone(row.referrer) ?? '' },
  { header: 'Referrer ID', accessor: (row) => personId(row.referrer) ?? '' },
  { header: 'From tier', accessor: (row) => USER_TIER_LABELS[row.from_tier] },
  { header: 'To tier', accessor: (row) => USER_TIER_LABELS[row.to_tier] },
  { header: 'Fee (NGN)', accessor: (row) => row.fee_amount },
  { header: 'Original amount (NGN)', accessor: (row) => row.original_amount ?? '' },
  { header: 'Discount (NGN)', accessor: (row) => row.discount_amount ?? '' },
  { header: 'Coupon', accessor: (row) => row.coupon_code_snapshot ?? '' },
  { header: 'Method', accessor: (row) => UPGRADE_PAYMENT_METHOD_LABELS[row.payment_method] },
  { header: 'Status', accessor: (row) => UPGRADE_STATUS_LABELS[row.status] },
  { header: 'Bank', accessor: (row) => row.bank_name ?? '' },
  { header: 'Reference', accessor: (row) => row.reference_no ?? '' },
  { header: 'Receipt', accessor: (row) => row.file_url ?? '' },
  { header: 'Reviewed at', accessor: (row) => row.reviewed_at ?? '' },
  { header: 'Reviewed by', accessor: (row) => personName(row.reviewed_by) ?? '' },
  { header: 'Decline reason', accessor: (row) => row.decline_reason ?? '' },
  { header: 'Upgrade ID', accessor: (row) => row._id },
];

export type UpgradeExportResult = {
  rows: number;
  /** Total the server reports, when it reports one. */
  total: number | null;
  /** True when the page cap stopped the loop before the queue ran out. */
  truncated: boolean;
};

async function fetchAllUpgrades(
  filters: UpgradeListFilters
): Promise<{ rows: Upgrade[]; total: number | null; truncated: boolean }> {
  const rows: Upgrade[] = [];
  let total: number | null = null;
  let page = 1;

  for (; page <= MAX_PAGES; page += 1) {
    const { items, meta } = await apiGetPaged('/admin/referrals/upgrades', UpgradeSchema, {
      params: {
        page,
        limit: EXPORT_PAGE_SIZE,
        search: filters.search || undefined,
        status: filters.status,
        payment_method: filters.payment_method,
        to_tier: filters.to_tier,
      },
    });

    if (meta.total != null) total = meta.total;
    rows.push(...items);

    // Short page means the queue is exhausted. An empty first page means there
    // was nothing to export at all.
    if (items.length < EXPORT_PAGE_SIZE) {
      return { rows, total, truncated: false };
    }
  }

  const truncated = total == null || rows.length < total;
  return { rows, total, truncated };
}

export const useUpgradeExport = () =>
  useMutation<UpgradeExportResult, Error, UpgradeListFilters | undefined>({
    mutationFn: async (filters) => {
      const { rows, total, truncated } = await fetchAllUpgrades(filters ?? {});

      if (rows.length > 0) {
        const stamp = new Date().toISOString().slice(0, 10);
        exportToCsv(rows, COLUMNS, `associate-upgrades-${stamp}.csv`);
      }

      return { rows: rows.length, total, truncated };
    },
  });

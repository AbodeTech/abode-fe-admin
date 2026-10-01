'use client';

import { useQueries } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { ObligationDetailSchema, type ObligationDetail } from '../schemas/asset-cost.schema';
import { costHistory, costLedger, costLedgerTotals } from '../schemas/cost-ledger.schema';
import { assetKeys } from './query-keys';
import { useCostItems } from './use-cost-items';
import { useCostObligations } from './use-cost-obligations';

/**
 * Everything the Costs tab shows, from three kinds of read:
 *
 *   GET .../costs/items            the cost items (rows of the table)
 *   GET .../costs                  the records under them (first 100)
 *   GET .../costs/:obligationId    once per record — the only place approved
 *                                  amounts by stage are returned
 *
 * The per-record reads use the same cache key as the record's detail sheet,
 * so opening a record costs nothing extra, and any write that refreshes a
 * record refreshes the table with it.
 *
 * `truncated` is true when the estate has more records than one page of the
 * list returns; the figures then cover only the newest 100 and the tab says so.
 */
export function useCostLedger(assetId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const items = useCostItems(assetId, { enabled });
  const obligations = useCostObligations(assetId, {}, { enabled });

  const details = useQueries({
    queries: (obligations.data?.items ?? []).map((obligation) => ({
      queryKey: assetKeys.costObligation(assetId, obligation.id),
      queryFn: () => apiGet(`/admin/assets/${assetId}/costs/${obligation.id}`, ObligationDetailSchema),
      enabled,
    })),
  });

  const error = items.error ?? obligations.error ?? details.find((query) => query.error)?.error ?? null;
  const isLoading = items.isLoading || obligations.isLoading || details.some((query) => query.isLoading);

  const records = details
    .map((query) => query.data)
    .filter((record): record is ObligationDetail => record !== undefined);

  const ready = !isLoading && !error && items.data !== undefined && obligations.data !== undefined;
  const rows = ready ? costLedger(items.data, records) : [];

  return {
    isLoading,
    error,
    rows,
    totals: costLedgerTotals(rows),
    history: ready ? costHistory(records) : [],
    truncated: (obligations.data?.meta.totalPages ?? 1) > 1,
  };
}

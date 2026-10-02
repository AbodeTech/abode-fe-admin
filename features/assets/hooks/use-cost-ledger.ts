'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  CostSummarySchema,
  costHistoryFromSummary,
  costLedgerFromSummary,
} from '../schemas/cost-ledger.schema';
import { assetKeys } from './query-keys';
import { useCostItems } from './use-cost-items';

/**
 * The Costs page read model. The backend groups every stage across the whole
 * estate and returns record-level rollups in the same response, so totals are
 * complete and this hook does not fan out one request per record.
 */
export function useCostLedger(assetId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const items = useCostItems(assetId, { enabled });
  const summary = useQuery({
    queryKey: assetKeys.costSummary(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/costs/summary`, CostSummarySchema),
    enabled: Boolean(assetId) && enabled,
  });

  const error = items.error ?? summary.error ?? null;
  const isLoading = items.isLoading || summary.isLoading;
  const ready = !isLoading && !error && items.data !== undefined && summary.data !== undefined;
  const rows = ready ? costLedgerFromSummary(items.data, summary.data) : [];

  return {
    isLoading,
    error,
    rows,
    totals: summary.data?.totals
      ? { ...summary.data.totals, withoutBudget: summary.data.totals.without_budget }
      : { budget: null, committed: null, incurred: null, paid: null, remaining: null, withoutBudget: 0 },
    history: ready ? costHistoryFromSummary(summary.data) : [],
    truncated: summary.data?.recent_entries_truncated ?? false,
  };
}

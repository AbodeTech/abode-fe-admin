'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { PlotSummarySchema, type PlotAllocationFilter } from '../schemas/plot-inventory.schema';
import { assetKeys } from './query-keys';

/**
 * GET /admin/assets/:assetId/plots/summary — the plot totals and allocation
 * readiness WITHOUT the rows (the backend runs the same calculation as
 * `.../plots` and drops the list). It takes the same filters, and returns
 * both `totals` (every plot) and `filtered_totals` (the plots matching the
 * filter) — so one call with `allocation: 'allocated'` yields the whole
 * estate's figures and the allocated subset's side by side.
 */
export const usePlotSummary = (assetId: string, filters: { allocation?: PlotAllocationFilter } = {}) =>
  useQuery({
    queryKey: assetKeys.plotSummary(assetId, filters),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/plots/summary`, PlotSummarySchema, {
        params: { allocation: filters.allocation },
      }),
    enabled: Boolean(assetId),
  });

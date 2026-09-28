'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetWithMeta } from '@/lib/api-client';

import type { PlotStatus } from '../schemas/block-plot.schema';
import {
  PlotInventoryResponseSchema,
  type PlotAllocationFilter,
  type PlotFieldFilter,
} from '../schemas/plot-inventory.schema';
import { assetKeys } from './query-keys';

export type PlotInventoryFilters = {
  page?: number;
  limit?: number;
  /** A block LABEL, not an id — the real `ListPlotsDto.block` matches on `block_label`, not `_id`. */
  block?: string | null;
  size?: number | null;
  status?: PlotStatus | null;
  allocation?: PlotAllocationFilter | null;
  fieldState?: PlotFieldFilter | null;
  search?: string | null;
};

function toParams(filters: PlotInventoryFilters) {
  return {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
    block: filters.block || undefined,
    size: filters.size ?? undefined,
    status: filters.status || undefined,
    allocation: filters.allocation || undefined,
    field_state: filters.fieldState || undefined,
    search: filters.search || undefined,
  };
}

/**
 * GET /admin/assets/:assetId/plots — the asset-wide, filtered plot list, with
 * server-computed totals (both unfiltered and filtered) and allocation-event
 * readiness in the SAME response. There is no separate `/plots/summary`
 * endpoint on the real backend — that was this app's own invention; render
 * `data.totals`/`data.filtered_totals` directly rather than calling a second
 * hook for them (see plot-inventory.schema.ts's header for the full,
 * confirmed-real shape this replaced).
 */
export const usePlotInventory = (assetId: string, filters: PlotInventoryFilters = {}) =>
  useQuery({
    queryKey: assetKeys.plotInventory(assetId, filters),
    queryFn: () =>
      apiGetWithMeta(`/admin/assets/${assetId}/plots`, PlotInventoryResponseSchema, {
        params: toParams(filters),
      }),
    enabled: Boolean(assetId),
  });

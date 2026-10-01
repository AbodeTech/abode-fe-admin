import { z } from 'zod';

import { OFFER_TYPES } from './asset.schema';
import { PlotStatusSchema } from './block-plot.schema';

/* ============================================================
 * Asset-wide plot inventory — GET /admin/assets/:assetId/plots.
 *
 * Confirmed REAL against `abode-be-v2` staging's field-staff module
 * (`AssetSiteSetupController`'s `plots()`, `SiteSetupService.plotInventory()`)
 * — a field-ops readiness view (parcelation, clearing, allocation-readiness),
 * not the customer/ground-confirmed shape this file used to invent. See
 * git history on this file for the old, never-real shape if migrating any
 * remaining callers.
 *
 * The whole response is one object, not a flat paginated array: `{asset,
 * plots, totals, filtered_totals, allocation_readiness}` under `data`, with
 * `meta{total,page,limit,totalPages}` as a sibling of `data` — so this reads
 * through a single `apiGet` against `PlotInventoryResponseSchema` below,
 * never `apiGetPaged`.
 *
 * `commercial_status` reuses `PlotStatusSchema` — the real `ListPlotsDto`'s
 * own `status` filter is `@IsIn(['available','allocated'])`, an exact match
 * to this file's `PLOT_STATUSES`.
 * ============================================================ */

export const PLOT_ALLOCATION_FILTERS = ['allocated', 'unallocated', 'allocation_ready', 'not_ready'] as const;
export type PlotAllocationFilter = (typeof PLOT_ALLOCATION_FILTERS)[number];

export const PLOT_FIELD_FILTERS = ['parcelled', 'not_parcelled', 'cleared', 'not_cleared'] as const;
export type PlotFieldFilter = (typeof PLOT_FIELD_FILTERS)[number];

export const PlotInventoryRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  block: z.string(),
  plot_number: z.number(),
  size_sqm: z.number(),
  commercial_status: PlotStatusSchema,
  product: z.enum(OFFER_TYPES).nullable(),
  payment_plan_id: z.string().nullable(),
  allocated_date: z.string().nullable(),
  parcelled: z.boolean(),
  re_pegged_count: z.number(),
  cleared_sqm: z.number(),
  clearing_percent: z.number(),
  allocation_ready: z.boolean(),
  field_events: z.number(),
});

export type PlotInventoryRow = z.infer<typeof PlotInventoryRowSchema>;

const PlotInventoryTotalsSchema = z.object({
  plots: z.number(),
  sqm: z.number(),
  parcelled: z.number(),
  fully_cleared: z.number(),
  cleared_sqm: z.number(),
  allocated: z.number(),
  allocation_ready: z.number(),
});

export type PlotInventoryTotals = z.infer<typeof PlotInventoryTotalsSchema>;

const AllocationEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  starts_at: z.string(),
  capacity: z.number().nullable(),
  reserved: z.number().nullable().optional(),
  size_unit: z.string().nullable().optional(),
});

export const PlotInventoryResponseSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  plots: z.array(PlotInventoryRowSchema),
  totals: PlotInventoryTotalsSchema,
  filtered_totals: PlotInventoryTotalsSchema,
  allocation_readiness: z.object({
    plots_ready: z.number(),
    plots_not_ready: z.number(),
    upcoming_event: AllocationEventSchema.nullable(),
    latest_completed_event: AllocationEventSchema.nullable(),
    note: z.string().nullable(),
  }),
});

export type PlotInventoryResponse = z.infer<typeof PlotInventoryResponseSchema>;

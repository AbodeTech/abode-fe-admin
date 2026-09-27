import { z } from 'zod';

import { InventoryModelVersionSchema, OfferTypeSchema } from './asset.schema';

/* ============================================================
 * GET /admin/assets/:assetId/sqm-inventory — the real square-metre ledger
 * position, confirmed directly from `SqmInventoryService.positionFor()` on
 * staging. Distinct from `land-configuration.schema.ts`'s catalogue (assigned
 * capacity per product) — this is the LIVE reserved/committed/available
 * ledger that only exists once an estate has activated sqm inventory (see
 * `sqm-reconciliation.schema.ts`'s activation flow).
 * ============================================================ */

export const SqmOperationalOverlaySchema = z.object({
  system_allocated_plots: z.number(),
  system_allocated_sqm: z.number(),
  ground_confirmed_customers: z.number(),
  ground_confirmed_sqm: z.number(),
});

/**
 * One product/size position. `size_id` is null for the product's own pool
 * row (and always null for Developer Plot, which has no catalogue sizes).
 * `operational_overlay` describes where a customer is in the physical
 * process — never add it into the commercial totals alongside it.
 */
export const SqmPositionSchema = z.object({
  offer_type: OfferTypeSchema,
  size_id: z.string().nullable(),
  size_sqm: z.number().nullable(),
  capacity_sqm: z.number(),
  selling_sqm: z.number(),
  sold_sqm: z.number(),
  released_sqm: z.number(),
  available_sqm: z.number(),
  defaulted_sqm: z.number(),
  suspended_sqm: z.number(),
  customers: z.number(),
  units: z.number(),
  purchase_snapshot_value: z.number(),
  operational_overlay: SqmOperationalOverlaySchema,
});

export type SqmPosition = z.infer<typeof SqmPositionSchema>;

/**
 * Only `sales_cap`/`sold_units`/`reserved_units`/`note` — NOT the same shape
 * as `land-configuration.schema.ts`'s `LegacyUnitInventorySchema` (which also
 * carries `available_units`). Two different endpoints, two different legacy
 * snapshots; don't merge them.
 */
export const SqmLegacyUnitInventorySchema = z.object({
  sales_cap: z.number(),
  sold_units: z.number(),
  reserved_units: z.number(),
  note: z.string(),
});

export const SqmInventorySchema = z.object({
  asset_id: z.string(),
  inventory_model_version: InventoryModelVersionSchema,
  sqm_inventory_active: z.boolean(),
  totals: z.object({
    capacity_sqm: z.number(),
    selling_sqm: z.number(),
    sold_sqm: z.number(),
    available_sqm: z.number(),
    released_sqm: z.number(),
    units: z.number(),
    customers: z.number(),
    purchase_snapshot_value: z.number(),
  }),
  positions: z.array(SqmPositionSchema).default([]),
  operational_overlay_note: z.string(),
  legacy_unit_inventory: SqmLegacyUnitInventorySchema,
});

export type SqmInventory = z.infer<typeof SqmInventorySchema>;

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
  contract_values: z.array(z.object({
    offer_type: OfferTypeSchema,
    sold_contract_value: z.number().nullable(),
    defaulted_contract_value: z.number().nullable(),
  })).default([]),
  contract_values_note: z.string().optional(),
  operational_overlay_note: z.string(),
  legacy_unit_inventory: SqmLegacyUnitInventorySchema,
});

export type SqmInventory = z.infer<typeof SqmInventorySchema>;

/* -------------------- per-product roll-up -------------------- */

/**
 * One product's position, rolled up from the ledger rows.
 *
 * ⚠ The ledger keeps TWO rows for every sized purchase — the product's pool
 * row (`size_id: null`) and the size's own row — and moves the same sqm
 * through both (`SqmInventoryService.keysFor()` returns `[poolKey, key]`). So
 * a product's commercial figures are its pool row alone; adding the size rows
 * on top counts every sale twice. The response totals and `ledgerTotals()`
 * both use one pool row per product for commercial sqm.
 *
 * The overlay figures (customers, units, value, defaulted, allocated) work
 * the other way round: each live plan is attached to exactly one row — its
 * size row, or the pool row when it has no size (Developer Plot) — so those
 * ARE summed across all of a product's rows.
 */
export type ProductPosition = {
  offer_type: SqmPosition['offer_type'];
  assigned_sqm: number;
  available_sqm: number;
  selling_sqm: number;
  sold_sqm: number;
  defaulted_sqm: number;
  suspended_sqm: number;
  allocated_sqm: number;
  allocated_plots: number;
  units: number;
  customers: number;
};

export function productPositions(positions: SqmPosition[]): ProductPosition[] {
  const byProduct = new Map<SqmPosition['offer_type'], SqmPosition[]>();
  for (const position of positions) {
    byProduct.set(position.offer_type, [...(byProduct.get(position.offer_type) ?? []), position]);
  }

  return [...byProduct.entries()].map(([offer_type, rows]) => {
    const pool = rows.find((row) => row.size_id === null);
    // A product with size rows but no pool row shouldn't exist — every
    // movement upserts the pool first — but fall back to the size rows rather
    // than report an empty product if it ever does.
    const commercial = pool ? [pool] : rows;
    const sum = (list: SqmPosition[], pick: (row: SqmPosition) => number) =>
      list.reduce((total, row) => total + pick(row), 0);

    return {
      offer_type,
      assigned_sqm: sum(commercial, (row) => row.capacity_sqm),
      available_sqm: sum(commercial, (row) => row.available_sqm),
      selling_sqm: sum(commercial, (row) => row.selling_sqm),
      sold_sqm: sum(commercial, (row) => row.sold_sqm),
      defaulted_sqm: sum(rows, (row) => row.defaulted_sqm),
      suspended_sqm: sum(rows, (row) => row.suspended_sqm),
      allocated_sqm: sum(rows, (row) => row.operational_overlay.system_allocated_sqm),
      allocated_plots: sum(rows, (row) => row.operational_overlay.system_allocated_plots),
      units: sum(rows, (row) => row.units),
      customers: sum(rows, (row) => row.customers),
    };
  });
}

/* -------------------- units and value lenses -------------------- */

/** One product's six table figures under one lens. `null` = not knowable, shown as an em-dash. */
export type LensFigures = {
  assigned: number | null;
  available: number | null;
  selling: number | null;
  sold: number | null;
  defaulted: number | null;
  allocated: number | null;
};

const NO_FIGURES: LensFigures = {
  assigned: null,
  available: null,
  selling: null,
  sold: null,
  defaulted: null,
  allocated: null,
};

/**
 * A product's position counted in units, or in naira, instead of sqm.
 *
 * The ledger only stores sqm, but each SIZE row knows its size, so
 * `sqm ÷ size_sqm` is an exact unit count for that row. Multiply those units
 * by a price per unit and you have a value. So both lenses are built from the
 * product's size rows — never its pool row, which is one lump of sqm with no
 * size to divide by.
 *
 * `unitWorth` is what one unit of a size counts for: `() => 1` for the units
 * lens, the size's current price for the value lens. If it returns `null`
 * for any size (no price set), the whole product is `null` — a total that
 * silently skips a size would be a wrong number, not a partial one.
 *
 * A product with no size rows (Developer Plot, or land not yet split into
 * sizes) has nothing to count and returns all `null`.
 */
export function lensFigures(
  positions: SqmPosition[],
  offerType: SqmPosition['offer_type'],
  unitWorth: (sizeId: string) => number | null
): LensFigures {
  const sizeRows = positions.filter(
    (row) => row.offer_type === offerType && row.size_id !== null && row.size_sqm
  );
  if (sizeRows.length === 0) return NO_FIGURES;

  const totals = { assigned: 0, available: 0, selling: 0, sold: 0, defaulted: 0, allocated: 0 };
  for (const row of sizeRows) {
    const worth = unitWorth(row.size_id as string);
    if (worth == null) return NO_FIGURES;
    const units = (sqm: number) => (sqm / (row.size_sqm as number)) * worth;
    totals.assigned += units(row.capacity_sqm);
    totals.available += units(row.available_sqm);
    totals.selling += units(row.selling_sqm);
    totals.sold += units(row.sold_sqm);
    totals.defaulted += units(row.defaulted_sqm);
    totals.allocated += units(row.operational_overlay.system_allocated_sqm);
  }
  return totals;
}

/** Estate-wide ledger figures, from the per-product roll-up — see `ProductPosition` for why not `totals`. */
export function ledgerTotals(products: ProductPosition[]) {
  const sum = (pick: (row: ProductPosition) => number) => products.reduce((total, row) => total + pick(row), 0);
  return {
    capacity_sqm: sum((row) => row.assigned_sqm),
    available_sqm: sum((row) => row.available_sqm),
    selling_sqm: sum((row) => row.selling_sqm),
    sold_sqm: sum((row) => row.sold_sqm),
    defaulted_sqm: sum((row) => row.defaulted_sqm),
    allocated_sqm: sum((row) => row.allocated_sqm),
    allocated_plots: sum((row) => row.allocated_plots),
  };
}

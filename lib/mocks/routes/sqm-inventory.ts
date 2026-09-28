import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset, offerTree, type MockAsset, type MockOfferType } from './assets';
import { getLandSnapshot } from './land-configuration';

/* ============================================================
 * Sqm inventory — /admin/assets/:assetId/sqm-inventory*, confirmed
 * field-for-field against `SqmInventoryService.positionFor()` and
 * `SqmActivationService.reconcile()`/`activate()` on abode-be-v2 staging
 * (PR #82). Unrelated to `inventory-reconciliation.schema.ts`'s by-size
 * physical/commercial demo panel — that one has no backend at all; this one
 * is real.
 *
 * GET  /admin/assets/:assetId/sqm-inventory                position ledger
 * GET  /admin/assets/:assetId/sqm-inventory/reconciliation  activation dry run
 * POST /admin/assets/:assetId/sqm-inventory/activate        one-way switch
 *
 * The real ledger's `positions` are only ever written by an actual purchase
 * reserving/committing sqm, or by `activate()` reconstructing them from every
 * live payment plan. This mock layer has never modelled individual payment
 * plans at that fidelity (see estate-profitability.ts's own note on the same
 * gap) — so before activation, `positions` is empty exactly like a real
 * never-activated estate; after activation, this mock distributes the
 * asset's existing legacy `sold_units`/`reserved_units` proportionally across
 * pools and sizes by their configured-unit share, standing in for what a real
 * reconstruction-from-plans would produce.
 * ============================================================ */

function requireAsset(assetId: string): MockAsset {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');
  return row;
}

type Position = {
  offer_type: MockOfferType;
  size_id: string | null;
  size_sqm: number | null;
  capacity_sqm: number;
  selling_sqm: number;
  sold_sqm: number;
  released_sqm: number;
  available_sqm: number;
  defaulted_sqm: number;
  suspended_sqm: number;
  customers: number;
  units: number;
  purchase_snapshot_value: number;
  operational_overlay: {
    system_allocated_plots: number;
    system_allocated_sqm: number;
    ground_confirmed_customers: number;
    ground_confirmed_sqm: number;
  };
};

const blankOverlay = () => ({
  system_allocated_plots: 0,
  system_allocated_sqm: 0,
  ground_confirmed_customers: 0,
  ground_confirmed_sqm: 0,
});

/** Every active pool + active size position, capacity-only until the estate has activated sqm inventory. */
function buildPositions(row: MockAsset): Position[] {
  const tree = offerTree(row).filter((offer) => offer.is_active && offer.assigned_sqm > 0);
  const active = row.inventory_model_version === 'sqm_v1';

  const totalUnitsAcrossEstate = tree.reduce(
    (sum, offer) => sum + offer.sizes.filter((s) => s.is_active).reduce((s, size) => s + size.configured_units, 0),
    0
  );

  const positions: Position[] = [];

  for (const offer of tree) {
    const sizes = offer.sizes.filter((s) => s.is_active);
    const poolCapacity = offer.assigned_sqm;

    // Pool-level row (size_id null) — always present for a pool that takes no sizes (Developer Plot).
    // No configured-unit basis to distribute legacy sold/reserved units onto here, so it stays at full capacity.
    if (offer.offer_type === 'developer-plot' || sizes.length === 0) {
      positions.push({
        offer_type: offer.offer_type as MockOfferType,
        size_id: null,
        size_sqm: null,
        capacity_sqm: poolCapacity,
        selling_sqm: 0,
        sold_sqm: 0,
        released_sqm: 0,
        available_sqm: poolCapacity,
        defaulted_sqm: 0,
        suspended_sqm: 0,
        customers: 0,
        units: 0,
        purchase_snapshot_value: 0,
        operational_overlay: blankOverlay(),
      });
      continue;
    }

    for (const size of sizes) {
      const shareOfEstate = totalUnitsAcrossEstate > 0 ? size.configured_units / totalUnitsAcrossEstate : 0;
      const soldUnits = active ? Math.round(row.sold_units * shareOfEstate) : 0;
      const reservedUnits = active ? Math.max(0, Math.round(row.reserved_units * shareOfEstate)) : 0;
      const soldSqm = soldUnits * size.size_sqm;
      const sellingSqm = reservedUnits * size.size_sqm;
      const capacitySqm = size.size_sqm * size.configured_units;

      positions.push({
        offer_type: offer.offer_type as MockOfferType,
        size_id: size._id,
        size_sqm: size.size_sqm,
        capacity_sqm: capacitySqm,
        selling_sqm: sellingSqm,
        sold_sqm: soldSqm,
        released_sqm: 0,
        available_sqm: Math.max(0, capacitySqm - sellingSqm - soldSqm),
        defaulted_sqm: 0,
        suspended_sqm: 0,
        customers: soldUnits + reservedUnits,
        units: soldUnits + reservedUnits,
        purchase_snapshot_value: 0,
        operational_overlay: blankOverlay(),
      });
    }
  }

  return positions;
}

/**
 * The real gate (`calculateLandConfiguration().valid`, confirmed on staging)
 * only cares about structural problems — over-allocation, invalid
 * quantities, an unnamed non-saleable row, Developer Plot carrying sizes.
 * Land that hasn't been assigned to a product or non-saleable use yet
 * (`unclassified_sqm > 0`) is NOT a blocker — that sqm just isn't part of any
 * pool yet, which is fine. This mock's land-configuration PUT already
 * enforces every one of those structural rules before a save can succeed, so
 * the only remaining gate here is "has a configuration been saved at all".
 */
function buildReconciliation(row: MockAsset, land: ReturnType<typeof getLandSnapshot>) {
  const blockers: string[] = [];
  if (land.total_land_sqm === null || land.state !== 'configured') {
    blockers.push('The Land Account has not been configured yet');
  }

  const byProduct = land.products
    .filter((p) => p.is_active)
    .map((p) => ({
      offer_type: p.offer_type,
      assigned_sqm: p.assigned_sqm,
      // This mock has never modelled individual live payment plans (see
      // this file's header) — nothing to report as already-committed here.
      committed_sqm: 0,
      over_by_sqm: 0,
    }));

  return {
    asset_id: row._id,
    asset_name: row.name,
    inventory_model_version: row.inventory_model_version,
    ready: blockers.length === 0,
    blockers,
    totals: { live_plans: 0, mapped_plans: 0, committed_sqm: 0 },
    by_product: byProduct,
    plans: [] as never[],
  };
}

export const sqmInventoryRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/sqm-inventory': ({ params }) => {
    const row = requireAsset(params.assetId);
    const positions = buildPositions(row);

    return {
      asset_id: row._id,
      inventory_model_version: row.inventory_model_version,
      sqm_inventory_active: row.inventory_model_version === 'sqm_v1',
      totals: {
        capacity_sqm: positions.reduce((s, p) => s + p.capacity_sqm, 0),
        selling_sqm: positions.reduce((s, p) => s + p.selling_sqm, 0),
        sold_sqm: positions.reduce((s, p) => s + p.sold_sqm, 0),
        available_sqm: positions.reduce((s, p) => s + p.available_sqm, 0),
        released_sqm: positions.reduce((s, p) => s + p.released_sqm, 0),
        units: positions.reduce((s, p) => s + p.units, 0),
        customers: positions.reduce((s, p) => s + p.customers, 0),
        purchase_snapshot_value: positions.reduce((s, p) => s + p.purchase_snapshot_value, 0),
      },
      positions,
      operational_overlay_note:
        'System allocation and ground confirmation describe where a customer is in the physical process. They are never added to the commercial totals above.',
      legacy_unit_inventory: {
        sales_cap: row.sales_cap,
        sold_units: row.sold_units,
        reserved_units: row.reserved_units,
        note: 'Legacy unit counters. These are not square metres.',
      },
    };
  },

  'GET /admin/assets/:assetId/sqm-inventory/reconciliation': ({ params }) => {
    const row = requireAsset(params.assetId);
    return buildReconciliation(row, getLandSnapshot(params.assetId));
  },

  'POST /admin/assets/:assetId/sqm-inventory/activate': ({ params }) => {
    const row = requireAsset(params.assetId);

    if (row.inventory_model_version === 'sqm_v1') {
      return { activated: false, already_active: true, report: buildReconciliation(row, getLandSnapshot(params.assetId)) };
    }

    const report = buildReconciliation(row, getLandSnapshot(params.assetId));
    if (!report.ready) {
      throw new MockHttpError(400, 'This estate cannot move to sqm inventory yet', 'LAND_CONFIGURATION_INCOMPLETE');
    }

    row.inventory_model_version = 'sqm_v1';
    return {
      activated: true,
      already_active: false,
      report: buildReconciliation(row, getLandSnapshot(params.assetId)),
    };
  },
};

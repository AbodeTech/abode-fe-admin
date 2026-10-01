import { MockHttpError, type MockRoutes } from '../router';
import { applyLandConfigurationSave, findActiveAsset, offerTree, type MockAsset, type MockOfferType } from './assets';
import { body, paged } from './util';

/* ============================================================
 * Land configuration — /admin/assets/:assetId/land-configuration*.
 *
 *   GET  /admin/assets/:assetId/land-configuration            current state
 *   PUT  /admin/assets/:assetId/land-configuration            complete replace, versioned
 *   GET  /admin/assets/:assetId/land-configuration/history    every revision, summary rows only
 *   GET  /admin/assets/:assetId/land-configuration/history/:version   one revision's full before/after
 *
 * Real module confirmed on abode-be-v2 staging (PR #82, "phase-1") — this
 * mirrors `AssetLandController`/`LandConfigurationService`'s actual shapes
 * field-for-field, verified directly against that source: `view_assets`/
 * `manage_assets` permissions, `products`/`non_saleable` on the PUT body
 * (not `product_pools`), a `legacy_unit_inventory` block on every GET/PUT
 * response, nested per-size capacity under each product, and a history LIST
 * that returns lightweight `summary` rows only — full before/after snapshots
 * are a separate per-version request. Carved out of the assets domain's
 * /admin/assets/* claim (see routes/index.ts) — the segment after :assetId
 * is the literal "land-configuration".
 *
 * The asset's own `total_land_sqm`/`land_inventory_state`/
 * `land_configuration_version` and each offer's `assigned_sqm` are the single
 * source of truth (see `applyLandConfigurationSave` in ./assets) — this file
 * only adds what has nowhere else to live: non-saleable land-use rows and the
 * versioned revision history.
 *
 * State rule (mechanically derived, not admin-set): `'not_configured'` while
 * `total_land_sqm` is null, `'draft'` once Create Asset sets it but no
 * `PUT` has ever succeeded (`land_configuration_version === 0`), and
 * `'configured'` after the first successful save — regardless of whether
 * unclassified sqm remains. "Still incomplete" is conveyed by
 * `unclassified_sqm` and `warnings`, not by `state`.
 * ============================================================ */

const MOCK_ADMIN_EMAIL = 'nicholas@abode.ng';

type MockLandUseCategory = 'road-circulation' | 'service-plot' | 'recreation-utility' | 'public-use' | 'other';

/** Internal store row — every version ever entered, active or not. */
type MockLandUse = {
  _id: string;
  category: MockLandUseCategory;
  label: string;
  allocated_sqm: number;
  is_active: boolean;
};

type PresentedSize = { id: string; size_sqm: number; configured_units: number; configured_sqm: number };
type PresentedProduct = {
  offer_type: MockOfferType;
  assigned_sqm: number;
  configured_sqm: number;
  unconfigured_sqm: number;
  takes_sizes: boolean;
  sizes: PresentedSize[];
};
type PresentedLandUse = { id: string; category: MockLandUseCategory; label: string; allocated_sqm: number };

/** GET/PUT .../land-configuration — the live, filtered-to-active view. */
type PresentedLandConfiguration = {
  asset_id: string;
  inventory_model_version: MockAsset['inventory_model_version'];
  state: MockAsset['land_inventory_state'];
  version: number;
  total_land_sqm: number | null;
  saleable_assigned_sqm: number;
  non_saleable_sqm: number;
  unclassified_sqm: number;
  products: PresentedProduct[];
  non_saleable: PresentedLandUse[];
  legacy_unit_inventory: {
    sales_cap: number;
    sold_units: number;
    reserved_units: number;
    available_units: number;
    note: string;
  };
  warnings: string[];
};

/** The `before`/`after` shape on a history revision — keeps inactive rows and their `is_active` flag. */
type LandConfigurationSnapshot = {
  total_land_sqm: number | null;
  saleable_assigned_sqm: number;
  non_saleable_sqm: number;
  configured_sqm: number;
  unclassified_sqm: number;
  state: MockAsset['land_inventory_state'];
  products: {
    offer_type: MockOfferType;
    assigned_sqm: number;
    configured_sqm: number;
    unconfigured_sqm: number;
    is_active: boolean;
    sizes: { size_id: string; size_sqm: number; configured_units: number; configured_sqm: number; is_active: boolean }[];
  }[];
  non_saleable: { land_use_id: string; category: MockLandUseCategory; label: string; allocated_sqm: number; is_active: boolean }[];
};

type StoredRevision = {
  version: number;
  reason: string;
  changed_by: string;
  changed_by_email: string | null;
  changed_at: string;
  before: LandConfigurationSnapshot | null;
  after: LandConfigurationSnapshot;
};

/** Non-saleable rows, keyed by asset id. There is no such concept on MockAsset. */
const landUses: Record<string, MockLandUse[]> = {};
/** Revisions, keyed by asset id, oldest first. */
const history: Record<string, StoredRevision[]> = {};
let landUseSeq = 0;

const nowIso = () => new Date().toISOString();

function computeProducts(row: MockAsset): {
  presented: PresentedProduct[];
  snapshot: LandConfigurationSnapshot['products'];
  saleableAssignedSqm: number;
  configuredSqm: number;
} {
  if (row.land_inventory_state === 'not_configured') {
    return { presented: [], snapshot: [], saleableAssignedSqm: 0, configuredSqm: 0 };
  }

  const snapshot = offerTree(row).map((offer) => {
    const configuredSqmForOffer = offer.sizes
      .filter((s) => s.is_active)
      .reduce((sum, s) => sum + s.size_sqm * s.configured_units, 0);
    return {
      offer_type: offer.offer_type as MockOfferType,
      assigned_sqm: offer.assigned_sqm,
      configured_sqm: configuredSqmForOffer,
      unconfigured_sqm: Math.max(0, offer.assigned_sqm - configuredSqmForOffer),
      is_active: offer.is_active,
      sizes: offer.sizes.map((s) => ({
        size_id: s._id,
        size_sqm: s.size_sqm,
        configured_units: s.configured_units,
        configured_sqm: s.size_sqm * s.configured_units,
        is_active: s.is_active,
      })),
    };
  });

  const active = snapshot.filter((p) => p.is_active);
  const presented: PresentedProduct[] = active.map((p) => ({
    offer_type: p.offer_type,
    assigned_sqm: p.assigned_sqm,
    configured_sqm: p.configured_sqm,
    unconfigured_sqm: p.unconfigured_sqm,
    takes_sizes: p.offer_type !== 'developer-plot',
    sizes: p.sizes
      .filter((s) => s.is_active)
      .map((s) => ({ id: s.size_id, size_sqm: s.size_sqm, configured_units: s.configured_units, configured_sqm: s.configured_sqm })),
  }));

  return {
    presented,
    snapshot,
    saleableAssignedSqm: active.reduce((sum, p) => sum + p.assigned_sqm, 0),
    configuredSqm: active.reduce((sum, p) => sum + p.configured_sqm, 0),
  };
}

function computeLandUses(assetId: string): {
  presented: PresentedLandUse[];
  snapshot: LandConfigurationSnapshot['non_saleable'];
  nonSaleableSqm: number;
} {
  const rows = landUses[assetId] ?? [];
  const snapshot = rows.map((u) => ({
    land_use_id: u._id,
    category: u.category,
    label: u.label,
    allocated_sqm: u.allocated_sqm,
    is_active: u.is_active,
  }));
  const active = snapshot.filter((u) => u.is_active);
  return {
    presented: active.map((u) => ({ id: u.land_use_id, category: u.category, label: u.label, allocated_sqm: u.allocated_sqm })),
    snapshot,
    nonSaleableSqm: active.reduce((sum, u) => sum + u.allocated_sqm, 0),
  };
}

function buildWarnings(row: MockAsset, products: LandConfigurationSnapshot['products'], unclassifiedSqm: number): string[] {
  const warnings: string[] = [];
  if (row.land_inventory_state !== 'not_configured' && row.total_land_sqm !== null && unclassifiedSqm > 0) {
    warnings.push(`${unclassifiedSqm} sqm of this estate is not yet classified`);
  }
  for (const product of products) {
    if (product.is_active && product.unconfigured_sqm > 0 && product.sizes.length > 0) {
      warnings.push(`${product.offer_type} has ${product.unconfigured_sqm} sqm with no size breakdown yet`);
    }
  }
  return warnings;
}

/** GET/PUT response — filtered to active rows only, matching `LandConfigurationService.present()`. */
function buildPresented(row: MockAsset): PresentedLandConfiguration {
  const { presented: products, snapshot: productSnapshot, saleableAssignedSqm } = computeProducts(row);
  const { presented: nonSaleable, nonSaleableSqm } = computeLandUses(row._id);
  const total = row.total_land_sqm;
  const unclassifiedSqm = total === null ? 0 : Math.max(0, total - saleableAssignedSqm - nonSaleableSqm);

  return {
    asset_id: row._id,
    inventory_model_version: row.inventory_model_version,
    state: row.land_inventory_state,
    version: row.land_configuration_version,
    total_land_sqm: total,
    saleable_assigned_sqm: saleableAssignedSqm,
    non_saleable_sqm: nonSaleableSqm,
    unclassified_sqm: unclassifiedSqm,
    products,
    non_saleable: nonSaleable,
    legacy_unit_inventory: {
      sales_cap: row.sales_cap,
      sold_units: row.sold_units,
      reserved_units: row.reserved_units,
      available_units: row.sales_cap - row.sold_units - row.reserved_units,
      note: 'Legacy unit counters. These are not square metres.',
    },
    warnings: buildWarnings(row, productSnapshot, unclassifiedSqm),
  };
}

/** A history before/after snapshot — keeps every row, active or not, matching `LandConfigurationService`'s `snapshot()`. */
function buildSnapshot(row: MockAsset): LandConfigurationSnapshot {
  const { snapshot: products, saleableAssignedSqm, configuredSqm } = computeProducts(row);
  const { snapshot: nonSaleable, nonSaleableSqm } = computeLandUses(row._id);
  const total = row.total_land_sqm;
  const unclassifiedSqm = total === null ? 0 : Math.max(0, total - saleableAssignedSqm - nonSaleableSqm);

  return {
    total_land_sqm: total,
    saleable_assigned_sqm: saleableAssignedSqm,
    non_saleable_sqm: nonSaleableSqm,
    configured_sqm: configuredSqm,
    unclassified_sqm: unclassifiedSqm,
    state: row.land_inventory_state,
    products,
    non_saleable: nonSaleable,
  };
}

/**
 * A rich, pre-populated example (Aviation City) so the read views and history
 * are exercisable without first walking through two Land Account edits by
 * hand. Runs once, on this file's first request for that asset.
 */
function seedIfNeeded(assetId: string): void {
  if (assetId !== '665faaaa00000000000000a1' || history[assetId]) return;

  const row = findActiveAsset(assetId);
  if (!row) return;

  const v1Before: LandConfigurationSnapshot = {
    total_land_sqm: null,
    saleable_assigned_sqm: 0,
    non_saleable_sqm: 0,
    configured_sqm: 0,
    unclassified_sqm: 0,
    state: 'draft',
    products: [],
    non_saleable: [],
  };

  applyLandConfigurationSave(assetId, {
    total_land_sqm: 350_000,
    land_inventory_state: 'configured',
    land_configuration_version: 1,
    products: [
      { offer_type: 'flex', assigned_sqm: 126_000 },
      { offer_type: 'full-ownership', assigned_sqm: 95_000 },
      { offer_type: 'commercial', assigned_sqm: 46_230 },
    ],
  });
  const v1After = buildSnapshot(row);

  history[assetId] = [
    {
      version: 1,
      reason: 'Initial land account setup',
      changed_by: '665fbbbb00000000000000b1',
      changed_by_email: MOCK_ADMIN_EMAIL,
      changed_at: new Date(Date.now() - 14 * 86_400_000).toISOString(),
      before: v1Before,
      after: v1After,
    },
  ];

  landUseSeq += 1;
  landUses[assetId] = [
    {
      _id: `665fl${String(landUseSeq).padStart(4, '0')}`,
      category: 'road-circulation',
      label: 'Internal roads',
      allocated_sqm: 40_000,
      is_active: true,
    },
    {
      _id: `665fl${String((landUseSeq += 1)).padStart(4, '0')}`,
      category: 'service-plot',
      label: 'Transformer and security area',
      allocated_sqm: 3_270,
      is_active: true,
    },
    {
      _id: `665fl${String((landUseSeq += 1)).padStart(4, '0')}`,
      category: 'recreation-utility',
      label: 'Recreation ground',
      allocated_sqm: 12_000,
      is_active: true,
    },
    {
      _id: `665fl${String((landUseSeq += 1)).padStart(4, '0')}`,
      category: 'public-use',
      label: 'Public setback',
      allocated_sqm: 13_500,
      is_active: true,
    },
  ];

  applyLandConfigurationSave(assetId, {
    total_land_sqm: 350_000,
    land_inventory_state: 'configured',
    land_configuration_version: 2,
    products: [
      { offer_type: 'flex', assigned_sqm: 126_000 },
      { offer_type: 'full-ownership', assigned_sqm: 95_000 },
      { offer_type: 'commercial', assigned_sqm: 46_230 },
    ],
  });
  const v2After = buildSnapshot(row);

  history[assetId].push({
    version: 2,
    reason: 'Added roads and services breakdown',
    changed_by: '665fbbbb00000000000000b1',
    changed_by_email: MOCK_ADMIN_EMAIL,
    changed_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    before: v1After,
    after: v2After,
  });
}

/** A second, lighter example — total and pools set at creation, never saved through the editor. */
function seedDraftIfNeeded(assetId: string): void {
  if (assetId !== '665faaaa00000000000000a2') return;
  const row = findActiveAsset(assetId);
  if (!row || row.total_land_sqm !== null) return;

  row.total_land_sqm = 180_000;
  row.land_inventory_state = 'draft';
  row.land_configuration_version = 0;
  const tree = offerTree(row);
  const flex = tree.find((offer) => offer.offer_type === 'flex');
  if (flex) flex.assigned_sqm = 150_000;
}

function ensureSeeded(assetId: string): void {
  seedIfNeeded(assetId);
  seedDraftIfNeeded(assetId);
}

function requireAsset(assetId: string): MockAsset {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');
  return row;
}

/** For estate-profitability.ts's in-process read of total_land_sqm/saleable_assigned_sqm — not an HTTP route. */
export function getLandSnapshot(assetId: string): LandConfigurationSnapshot {
  ensureSeeded(assetId);
  return buildSnapshot(requireAsset(assetId));
}

const LAND_USE_CATEGORIES: readonly MockLandUseCategory[] = [
  'road-circulation',
  'service-plot',
  'recreation-utility',
  'public-use',
  'other',
];

export const landConfigurationRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/land-configuration': ({ params }) => {
    ensureSeeded(params.assetId);
    const row = requireAsset(params.assetId);
    return buildPresented(row);
  },

  /**
   * Complete replacement, versioned. Mirrors the real DTO exactly: total
   * land, every product pool (`products`, not `product_pools`), every
   * non-saleable row, a required `reason`, and `expected_version` for
   * optimistic concurrency.
   *
   * To reproduce the 409 by hand: open the Land Account editor in two tabs,
   * save from one (version goes to N+1), then submit the other — its
   * `expected_version` is still N and this throws
   * `LAND_CONFIGURATION_VERSION_CONFLICT`.
   */
  'PUT /admin/assets/:assetId/land-configuration': ({ params, body: raw }) => {
    const row = requireAsset(params.assetId);
    const dto = body<{
      expected_version?: number;
      reason?: string;
      total_land_sqm?: number;
      products?: { offer_type: MockOfferType; assigned_sqm: number }[];
      non_saleable?: {
        land_use_id?: string;
        category: MockLandUseCategory;
        label?: string;
        allocated_sqm: number;
        is_active?: boolean;
      }[];
    }>(raw);

    if (dto.expected_version !== row.land_configuration_version) {
      throw new MockHttpError(
        409,
        'This land configuration has changed since you loaded it. Review the latest version before saving again.',
        'LAND_CONFIGURATION_VERSION_CONFLICT'
      );
    }
    if (!dto.reason?.trim()) {
      throw new MockHttpError(400, 'reason should not be empty', 'VALIDATION_FAILED');
    }
    if (!dto.total_land_sqm || !Number.isInteger(dto.total_land_sqm) || dto.total_land_sqm <= 0) {
      throw new MockHttpError(400, 'total_land_sqm must be a positive whole number', 'TOTAL_LAND_REQUIRED');
    }

    const products = dto.products ?? [];
    if (new Set(products.map((p) => p.offer_type)).size !== products.length) {
      throw new MockHttpError(400, 'Each product can only be assigned once', 'INVALID_LAND_QUANTITY');
    }
    for (const pool of products) {
      if (!Number.isInteger(pool.assigned_sqm) || pool.assigned_sqm < 0) {
        throw new MockHttpError(
          400,
          `${pool.offer_type}: assigned sqm must be a non-negative whole number`,
          'INVALID_LAND_QUANTITY'
        );
      }
    }

    const nonSaleableInput = dto.non_saleable ?? [];
    for (const row_ of nonSaleableInput) {
      if (!LAND_USE_CATEGORIES.includes(row_.category)) {
        throw new MockHttpError(400, `category must be one of: ${LAND_USE_CATEGORIES.join(', ')}`, 'VALIDATION_FAILED');
      }
      if (row_.category === 'other' && !row_.label?.trim()) {
        throw new MockHttpError(400, 'An "Other" land-use row needs a name', 'VALIDATION_FAILED');
      }
      if (!Number.isInteger(row_.allocated_sqm) || row_.allocated_sqm < 0) {
        throw new MockHttpError(400, 'allocated_sqm must be a non-negative whole number', 'INVALID_LAND_QUANTITY');
      }
    }

    const assignedSqm = products.reduce((sum, p) => sum + p.assigned_sqm, 0);
    const nonSaleableSqm = nonSaleableInput
      .filter((row_) => row_.is_active ?? true)
      .reduce((sum, row_) => sum + row_.allocated_sqm, 0);
    if (assignedSqm + nonSaleableSqm > dto.total_land_sqm) {
      throw new MockHttpError(
        400,
        `Assigned sqm (${assignedSqm}) plus non-saleable sqm (${nonSaleableSqm}) exceeds the total estate size (${dto.total_land_sqm})`,
        'LAND_ALLOCATION_EXCEEDS_TOTAL'
      );
    }

    const before = buildSnapshot(row);

    applyLandConfigurationSave(params.assetId, {
      total_land_sqm: dto.total_land_sqm,
      land_inventory_state: 'configured',
      land_configuration_version: row.land_configuration_version + 1,
      products,
    });

    landUses[params.assetId] = nonSaleableInput.map((input) => ({
      _id: input.land_use_id ?? `665fl${String((landUseSeq += 1)).padStart(4, '0')}`,
      category: input.category,
      label: input.label?.trim() ?? '',
      allocated_sqm: input.allocated_sqm,
      is_active: input.is_active ?? true,
    }));

    const after = buildSnapshot(row);

    history[params.assetId] = [
      ...(history[params.assetId] ?? []),
      {
        version: row.land_configuration_version,
        reason: dto.reason.trim(),
        changed_by: '665fbbbb00000000000000b1',
        changed_by_email: MOCK_ADMIN_EMAIL,
        changed_at: nowIso(),
        before,
        after,
      },
    ];

    return buildPresented(row);
  },

  'GET /admin/assets/:assetId/land-configuration/history': ({ params, query }) => {
    ensureSeeded(params.assetId);
    requireAsset(params.assetId);
    const revisions = [...(history[params.assetId] ?? [])].sort((a, b) => b.version - a.version);
    const summaries = revisions.map((revision) => ({
      version: revision.version,
      reason: revision.reason,
      changed_by: revision.changed_by,
      changed_by_email: revision.changed_by_email,
      changed_at: revision.changed_at,
      summary: {
        total_land_sqm: revision.after.total_land_sqm,
        saleable_assigned_sqm: revision.after.saleable_assigned_sqm,
        non_saleable_sqm: revision.after.non_saleable_sqm,
        unclassified_sqm: revision.after.unclassified_sqm,
        state: revision.after.state,
      },
    }));
    return paged(summaries, query, 20);
  },

  'GET /admin/assets/:assetId/land-configuration/history/:version': ({ params }) => {
    ensureSeeded(params.assetId);
    requireAsset(params.assetId);
    const revision = (history[params.assetId] ?? []).find(
      (candidate) => candidate.version === Number(params.version)
    );
    if (!revision) throw new MockHttpError(404, 'That version was not found', 'LAND_REVISION_NOT_FOUND');
    return revision;
  },
};

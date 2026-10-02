import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Assets — the assets domain owns /admin/assets/*.
 *
 * Rows match what `asset.service.findAll` returns: the full asset document
 * plus an `offers[]` summary aggregated across both size collections.
 *
 * Note the fixtures deliberately include an asset carrying **all three** offer
 * types, one with an inactive offer, a draft, a sold-out, a commercial-only
 * one, and a soft-deleted one — the states the single table exists to render,
 * none of which v1's two tables could express.
 *
 * `commercial` is stored and priced exactly like `full-ownership` (the BE's
 * `usesFoModel`), so every non-flex branch below covers it.
 *
 * Money is decimal naira.
 * ============================================================ */

export type MockOfferType = 'flex' | 'full-ownership' | 'commercial' | 'developer-plot';

type MockOfferSummary = {
  offer_type: MockOfferType;
  is_active: boolean;
  size_count: number;
  plan_count: number;
};

export type MockAsset = {
  _id: string;
  name: string;
  asset_location: string;
  /** The estate's state. Null on the seed that predates the field, on purpose. */
  state?: string | null;
  google_map: string | null;
  description: string;
  amenities: string[];
  landmark: string[];
  topography: string | null;
  asset_purpose: string | null;
  hero_image: string | null;
  pictures: string[];
  documents: Record<string, string | undefined>;
  pitch_pack?: { url: string; size_bytes: number; uploaded_at: string } | null;
  asset_history: { year: number; value: number }[];
  sales_cap: number;
  sold_units: number;
  reserved_units: number;
  available_units: number;
  /**
   * The physical-land account, layered on top of the legacy fields above —
   * see features/assets/schemas/land-configuration.schema.ts. `null`/
   * `'not_configured'` means this fixture predates the feature and is legacy
   * only, exactly like a real asset created before this migration.
   */
  total_land_sqm: number | null;
  land_inventory_state: 'not_configured' | 'draft' | 'configured';
  inventory_model_version: 'legacy_units' | 'sqm_v1';
  land_configuration_version: number;
  sold: boolean;
  visibility: 'draft' | 'internal' | 'public';
  deleted_at: string | null;
  offers: MockOfferSummary[];
  createdAt: string;
  updatedAt: string;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const asset = (
  partial: Partial<MockAsset> & Pick<MockAsset, '_id' | 'name' | 'asset_location' | 'sales_cap' | 'offers'>
): MockAsset => {
  const sold_units = partial.sold_units ?? 0;
  const reserved_units = partial.reserved_units ?? 0;

  return {
    google_map: null,
    description: 'Serviced plots with road access, drainage and perimeter fencing.',
    amenities: ['Perimeter fencing', 'Road network', 'Drainage', 'Security post'],
    landmark: [],
    topography: 'flat',
    asset_purpose: 'Residential',
    hero_image: null,
    pictures: [],
    documents: {},
    pitch_pack: null,
    asset_history: [],
    total_land_sqm: null,
    land_inventory_state: 'not_configured',
    inventory_model_version: 'legacy_units',
    land_configuration_version: 0,
    sold: false,
    visibility: 'public',
    deleted_at: null,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(3),
    ...partial,
    sold_units,
    reserved_units,
    // The BE returns this as a virtual; mirror the same arithmetic.
    available_units: Math.max(0, partial.sales_cap - sold_units - reserved_units),
  };
};

/** Mirrors the BE's state enum — the PATCH above validates against it. */
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
] as const;

const assets: MockAsset[] = [
  // All three offer types on one asset — impossible in v1's model.
  asset({
    _id: '665faaaa00000000000000a1',
    name: 'Aviation City',
    asset_location: 'Ibeju-Lekki, Lagos',
    state: 'Lagos',
    sales_cap: 480,
    sold_units: 312,
    reserved_units: 24,
    offers: [
      { offer_type: 'flex', is_active: true, size_count: 3, plan_count: 9 },
      { offer_type: 'full-ownership', is_active: true, size_count: 2, plan_count: 4 },
      { offer_type: 'commercial', is_active: true, size_count: 2, plan_count: 4 },
    ],
    createdAt: daysAgo(210),
    // Exercises the "current file" state — every other fixture is the empty state.
    pitch_pack: {
      url: 'https://res.cloudinary.com/abode/raw/upload/v1/assets/aviation-city-pitch-pack.pdf',
      size_bytes: 4_200_000,
      uploaded_at: daysAgo(14),
    },
  }),
  asset({
    _id: '665faaaa00000000000000a2',
    name: 'Harmony Gardens',
    asset_location: 'Epe, Lagos',
    state: 'Lagos',
    sales_cap: 260,
    sold_units: 88,
    offers: [{ offer_type: 'flex', is_active: true, size_count: 2, plan_count: 6 }],
    createdAt: daysAgo(150),
  }),
  // Full-ownership only, and the offer is switched off.
  asset({
    _id: '665faaaa00000000000000a3',
    name: 'Cornerstone Estate',
    asset_location: 'Abeokuta, Ogun',
    // Deliberately unset: this is what an asset looks like before the backfill,
    // so the "not set" state of the form and the overview stay exercisable.
    state: null,
    sales_cap: 180,
    sold_units: 41,
    offers: [{ offer_type: 'full-ownership', is_active: false, size_count: 2, plan_count: 5 }],
    createdAt: daysAgo(96),
  }),
  // Not yet published.
  asset({
    _id: '665faaaa00000000000000a4',
    name: 'Riverview Heights',
    asset_location: 'Asaba, Delta',
    sales_cap: 120,
    visibility: 'draft',
    offers: [{ offer_type: 'flex', is_active: true, size_count: 1, plan_count: 3 }],
    createdAt: daysAgo(11),
  }),
  // Fully allocated.
  asset({
    _id: '665faaaa00000000000000a5',
    name: 'Palm Grove Court',
    asset_location: 'Ibadan, Oyo',
    sales_cap: 90,
    sold_units: 90,
    sold: true,
    offers: [
      { offer_type: 'flex', is_active: false, size_count: 2, plan_count: 6 },
      { offer_type: 'full-ownership', is_active: false, size_count: 1, plan_count: 2 },
    ],
    createdAt: daysAgo(320),
  }),
  asset({
    _id: '665faaaa00000000000000a6',
    name: 'Emerald Parks',
    asset_location: 'Kuje, Abuja',
    sales_cap: 200,
    sold_units: 12,
    visibility: 'internal',
    offers: [{ offer_type: 'full-ownership', is_active: true, size_count: 3, plan_count: 7 }],
    createdAt: daysAgo(28),
  }),
  // Commercial only — the offer type that landed with the 2026-08-22 BE merge.
  asset({
    _id: '665faaaa00000000000000a8',
    name: 'Trade Fair Commercial Hub',
    asset_location: 'Ojo, Lagos',
    sales_cap: 75,
    sold_units: 9,
    asset_purpose: 'Commercial',
    offers: [{ offer_type: 'commercial', is_active: true, size_count: 2, plan_count: 4 }],
    createdAt: daysAgo(19),
  }),
  // Soft-deleted — hidden unless include_deleted is set.
  asset({
    _id: '665faaaa00000000000000a7',
    name: 'Old Mill Estate',
    asset_location: 'Ikorodu, Lagos',
    sales_cap: 60,
    sold_units: 6,
    deleted_at: daysAgo(40),
    offers: [{ offer_type: 'flex', is_active: false, size_count: 1, plan_count: 2 }],
    createdAt: daysAgo(400),
  }),
];

/**
 * Minimal id+name slice of the fixture above, for other mock domains that
 * need to resolve a real `GET /admin/assets` id (e.g. company-events'
 * create-event site dropdown) without duplicating the full asset list.
 * Includes drafts and the soft-deleted row on purpose — an id picked from
 * the live dropdown must always resolve here too.
 */
export const MOCK_ASSET_DIRECTORY: { _id: string; name: string }[] = assets.map((a) => ({
  _id: a._id,
  name: a.name,
}));

/* -------------------- the detail tree -------------------- */

export type MockPlan = {
  tenor_months: number;
  land_price: number;
  initial_payment: number;
  monthly_installment: number;
  is_promo?: boolean;
  is_active: boolean;
  /** 🚧 Provisional — layered onto the real Plan contract, see asset-detail.schema.ts's PlanSchema doc comment. */
  development_levy: number;
  document_levy: number;
};

type MockSize = {
  _id: string;
  offer_id: string;
  size_sqm: number;
  configured_units: number;
  document_fee?: number;
  is_active: boolean;
  plans: MockPlan[];
};

function configuredSqm(size: Pick<MockSize, 'size_sqm' | 'configured_units'>): number {
  return size.size_sqm * size.configured_units;
}

/** Display labels for error messages only — this file is independent of the features/ schema layer. */
const OFFER_TYPE_DISPLAY_LABELS: Record<string, string> = {
  flex: 'Flex',
  'full-ownership': 'Full ownership',
  commercial: 'Commercial',
  'developer-plot': 'Developer plot',
};

/**
 * Server-side mirror of the backend rule: `sum(active size_sqm ×
 * configured_units) <= product assigned_sqm`. Skipped for an asset that
 * predates the land account (`assigned_sqm` is a placeholder 0 there, not a
 * real pool) — legacy size editing must keep working exactly as before.
 */
function assertWithinProductCapacity(
  offer: Pick<MockOffer, 'assigned_sqm' | 'sizes'>,
  offerLabel: string,
  excludingSizeId: string | null,
  proposed: Pick<MockSize, 'size_sqm' | 'configured_units'>
): void {
  if (offer.assigned_sqm <= 0) return;

  const otherConfiguredSqm = offer.sizes
    .filter((size) => size.is_active && size._id !== excludingSizeId)
    .reduce((sum, size) => sum + configuredSqm(size), 0);
  const total = otherConfiguredSqm + configuredSqm(proposed);
  const excess = total - offer.assigned_sqm;

  if (excess > 0) {
    throw new MockHttpError(
      400,
      `This would exceed ${offerLabel} by ${excess.toLocaleString()} sqm`,
      'PRODUCT_SIZE_CAPACITY_EXCEEDED'
    );
  }
}

export type MockOffer = {
  _id: string;
  asset_id: string;
  offer_type: string;
  is_active: boolean;
  allocation_qualification_pct: number;
  payment_type?: string;
  /** The product's commercial land pool. 0 on legacy fixtures, which predate the land account. */
  assigned_sqm: number;
  sizes: MockSize[];
};

/**
 * Plans that satisfy the backend's arithmetic:
 * `initial + monthly × (tenor − 1) ≈ land_price`, within `max(1, tenor)`.
 */
function instalmentPlan(tenor: number, landPrice: number, depositPct = 0.3): MockPlan {
  const initial = Math.round(landPrice * depositPct);
  return {
    tenor_months: tenor,
    land_price: landPrice,
    initial_payment: initial,
    monthly_installment: tenor > 1 ? Math.round((landPrice - initial) / (tenor - 1)) : 0,
    is_active: true,
    development_levy: 0,
    document_levy: 0,
  };
}

const outrightPlan = (landPrice: number): MockPlan => ({
  tenor_months: 0,
  land_price: landPrice,
  initial_payment: landPrice,
  monthly_installment: 0,
  is_active: true,
  development_levy: 0,
  document_levy: 0,
});

/** Built lazily per asset and then mutated by the write routes. */
const trees: Record<string, MockOffer[]> = {};

/** Recompute a summary row's counts after any tree write. */
function syncCounts(assetId: string, offerType: string): void {
  const offer = trees[assetId]?.find((candidate) => candidate.offer_type === offerType);
  const summary = assets
    .find((candidate) => candidate._id === assetId)
    ?.offers.find((candidate) => candidate.offer_type === offerType);
  if (!offer || !summary) return;
  summary.size_count = offer.sizes.length;
  summary.plan_count = offer.sizes.reduce((total, size) => total + size.plans.length, 0);
}

const MOCK_ADMIN_NAME = 'Nicholas';

/**
 * "Preserve offer configuration history" — an activity log, not a diffable
 * version history: the six real offer/size/plan endpoints have no `reason`
 * field and no `expected_version` guard (an already-shipped BE contract this
 * work must not reshape), so there's no admin-authored reason and no
 * before/after snapshot to diff. Keyed by asset id, newest appended last.
 */
type MockOfferConfigAction =
  | 'add-offer'
  | 'update-offer'
  | 'add-size'
  | 'update-size'
  | 'delete-size'
  | 'add-plan'
  | 'update-plan'
  | 'delete-plan';
type MockOfferConfigRevision = {
  version: number;
  action: MockOfferConfigAction;
  summary: string;
  changed_by: string | null;
  changed_at: string;
};
const offerConfigHistory: Record<string, MockOfferConfigRevision[]> = {};

function recordOfferConfigChange(assetId: string, action: MockOfferConfigAction, summary: string): void {
  const entries = offerConfigHistory[assetId] ?? [];
  entries.push({
    version: entries.length + 1,
    action,
    summary,
    changed_by: MOCK_ADMIN_NAME,
    changed_at: nowIso(),
  });
  offerConfigHistory[assetId] = entries;
}

function requireSize(assetId: string, offerType: string, sizeId: string): MockSize {
  const offer = trees[assetId]?.find((candidate) => candidate.offer_type === offerType);
  if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  const size = offer.sizes.find((candidate) => candidate._id === sizeId);
  if (!size) throw new MockHttpError(404, 'Size not found', 'SIZE_NOT_FOUND');
  return size;
}

export function offerTree(row: MockAsset): MockOffer[] {
  if (trees[row._id]) return trees[row._id];

  trees[row._id] = row.offers.map((summary, offerIndex) => {
    const offerId = `${row._id}-offer-${offerIndex}`;
    const isFlex = summary.offer_type === 'flex';

    const sizes: MockSize[] = Array.from({ length: summary.size_count }).map((_, sizeIndex) => {
      const sqm = 300 + sizeIndex * 200;
      const base = 1_800_000 + sizeIndex * 1_400_000;

      const plans = isFlex
        ? [instalmentPlan(12, base), instalmentPlan(24, Math.round(base * 1.1)), instalmentPlan(36, Math.round(base * 1.2))]
        : [outrightPlan(base), instalmentPlan(24, Math.round(base * 1.08))];

      return {
        _id: `${offerId}-size-${sizeIndex}`,
        offer_id: offerId,
        size_sqm: sqm,
        configured_units: 12 - sizeIndex * 3,
        ...(isFlex ? {} : { document_fee: 150_000 }),
        is_active: true,
        plans: plans.slice(0, Math.max(1, Math.round(summary.plan_count / Math.max(1, summary.size_count)))),
      };
    });

    return {
      _id: offerId,
      asset_id: row._id,
      offer_type: summary.offer_type,
      is_active: summary.is_active,
      allocation_qualification_pct: isFlex ? 30 : 40,
      ...(isFlex ? {} : { payment_type: 'all-inclusive' }),
      // This asset predates the land account (row.land_inventory_state is
      // 'not_configured' for every seeded fixture) — 0 rather than a made-up
      // figure, since there is no real assignment to report.
      assigned_sqm: 0,
      sizes,
    };
  });

  return trees[row._id];
}

/** For lib/mocks/routes/land-configuration.ts — the same lookup every write route here uses. */
export function findActiveAsset(assetId: string): MockAsset | undefined {
  return assets.find((candidate) => candidate._id === assetId && !candidate.deleted_at);
}

/**
 * Applies a Land Account editor save to the single source of truth — this
 * asset's own `total_land_sqm`/`land_inventory_state`/
 * `land_configuration_version` fields and its offer tree's `assigned_sqm`.
 * Non-saleable land uses live entirely in land-configuration.ts (there is no
 * such concept on `MockAsset`), so that file keeps its own store for those.
 *
 * A product pool with no existing offer gets a new offer shell — exactly
 * what `POST /admin/assets` does for a pool at creation time — since the
 * editor can introduce a product the asset didn't start with. There is no
 * removal path: offers are retired via `is_active: false`, never deleted,
 * matching every other write route in this file.
 */
export function applyLandConfigurationSave(
  assetId: string,
  patch: {
    total_land_sqm: number;
    land_inventory_state: MockAsset['land_inventory_state'];
    land_configuration_version: number;
    products: { offer_type: MockOfferType; assigned_sqm: number }[];
  }
): void {
  const row = findActiveAsset(assetId);
  if (!row) return;

  row.total_land_sqm = patch.total_land_sqm;
  row.land_inventory_state = patch.land_inventory_state;
  row.land_configuration_version = patch.land_configuration_version;
  row.updatedAt = new Date().toISOString();

  const tree = offerTree(row);
  for (const pool of patch.products) {
    const existingOffer = tree.find((candidate) => candidate.offer_type === pool.offer_type);
    if (existingOffer) {
      existingOffer.assigned_sqm = pool.assigned_sqm;
      continue;
    }

    const offerId = `${row._id}-offer-${tree.length}`;
    tree.push({
      _id: offerId,
      asset_id: row._id,
      offer_type: pool.offer_type,
      is_active: true,
      allocation_qualification_pct: 0,
      assigned_sqm: pool.assigned_sqm,
      sizes: [],
    });
    row.offers.push({ offer_type: pool.offer_type, is_active: true, size_count: 0, plan_count: 0 });
  }
}

/* -------------------- land inventory (blocks + plots) --------------------
 *
 * abode-be-v2's BlockPlotController. Kept here rather than in a routes file of
 * its own because the screen is a tab on the asset, and the fixtures are keyed
 * by the same asset ids this file already owns.
 *
 * Seeded so every state the tab renders is reachable: a block with free plots,
 * a block holding an allocated plot (so both "locked" and the refused block
 * delete are exercisable), and an empty asset with no blocks at all.
 */
type MockBlock = {
  _id: string;
  asset: string;
  label: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

type MockPlot = {
  _id: string;
  block: string;
  block_label: string;
  plot_number: number;
  size: number;
  status: 'available' | 'allocated';
  payment_plan?: string | null;
  allocated_date?: string | null;
  /**
   * Denormalized at write time by the real backend's allocate flow — same
   * pattern already used for `block_label` — not a cross-reference into
   * features/allocation's own separate fixture store (its payment_plan ids
   * use a different scheme, `pp-<userId>`, and don't correspond to this
   * file's seeded plots).
   */
  customer_name?: string | null;
  attributable_value?: number | null;
  createdAt: string;
  updatedAt: string;
};

const BLOCK_A = '665fbb0000000000000000b1';
const BLOCK_B = '665fbb0000000000000000b2';

const nowIso = () => new Date().toISOString();

const blocks: MockBlock[] = [
  {
    _id: BLOCK_A,
    asset: '665faaaa00000000000000a1',
    label: 'A',
    description: 'West-side blocks adjacent to the access road',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    _id: BLOCK_B,
    asset: '665faaaa00000000000000a1',
    label: 'B',
    description: undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const plots: MockPlot[] = [
  ...Array.from({ length: 6 }, (_, index) => ({
    _id: `665fcp000000000000000a${index + 1}`,
    block: BLOCK_A,
    block_label: 'A',
    plot_number: index + 1,
    size: 500,
    // One allocated plot: freezes its row and blocks the delete on block A.
    status: (index === 0 ? 'allocated' : 'available') as MockPlot['status'],
    payment_plan: index === 0 ? '665fpl00000000000000fo01' : null,
    allocated_date: index === 0 ? nowIso() : null,
    customer_name: index === 0 ? 'Adaeze Okafor' : null,
    attributable_value: index === 0 ? 92_000_000 : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })),
  ...Array.from({ length: 3 }, (_, index) => ({
    _id: `665fcp000000000000000b${index + 1}`,
    block: BLOCK_B,
    block_label: 'B',
    plot_number: index + 1,
    size: 300,
    status: 'available' as MockPlot['status'],
    payment_plan: null,
    allocated_date: null,
    customer_name: null,
    attributable_value: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })),
];

let blockSeq = 0;
let plotSeq = 0;

function requireBlock(blockId: string): MockBlock {
  const block = blocks.find((candidate) => candidate._id === blockId);
  if (!block) throw new MockHttpError(404, 'Payment plan not found', 'PLAN_NOT_FOUND');
  return block;
}

function requirePlot(plotId: string): MockPlot {
  const plot = plots.find((candidate) => candidate._id === plotId);
  if (!plot) throw new MockHttpError(404, 'One or more requested plots do not exist', 'PLOT_NOT_FOUND');
  return plot;
}

/**
 * "Separate system allocation from ground confirmation" — a per-plot field
 * submission distinct from `status` above (a DB flag set the instant
 * POST .../allocate runs). "Report then verify" — same shape as Site
 * Setup's fencing progress: an admin-verified submission is what makes a
 * plot "Ground confirmed"; an unverified one is pending. Keyed by plot id.
 */
type MockGroundConfirmation = {
  _id: string;
  plot_id: string;
  submitted_by: string;
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
};
const MOCK_SITE_MANAGER_NAME = 'Chidinma Okoro';
const groundConfirmationsByPlot: Record<string, MockGroundConfirmation[]> = {
  // Block A plot 1 is already allocated to a real customer — a pending (not
  // yet verified) submission here is the honest demo state: it shows the
  // report-then-verify flow without fabricating a confirmed ground truth.
  '665fcp000000000000000a1': [
    {
      _id: 'gc-0001',
      plot_id: '665fcp000000000000000a1',
      submitted_by: MOCK_SITE_MANAGER_NAME,
      submitted_at: '2026-08-25T09:00:00.000Z',
      verified_by: null,
      verified_at: null,
      notes: 'Plot staked and handed over to the buyer on site.',
    },
  ],
};
let groundConfirmationSeq = 1;

function isGroundConfirmed(plotId: string): boolean {
  return (groundConfirmationsByPlot[plotId] ?? []).some((entry) => entry.verified_at !== null);
}

/**
 * Every plot across every block belonging to this asset — the flat plot
 * store has no per-asset index, so this filters by block membership.
 * Exported for inventory-reconciliation.ts's in-process read (not an HTTP
 * route) — no need for that file to re-derive the same block-membership join.
 */
export function assetPlots(assetId: string): MockPlot[] {
  const blockIds = new Set(blocks.filter((b) => b.asset === assetId).map((b) => b._id));
  return plots.filter((p) => blockIds.has(p.block));
}

/** For inventory-reconciliation.ts's in-process read (not an HTTP route) — same reasoning as assetPlots's own export comment above. */
export { isGroundConfirmed };

export type { MockPlot };

/**
 * Mirrors the real `ListPlotsDto` param names (`block` label, exact `size`,
 * `status`), not this file's older invented `block_id`/`min_size`/`max_size`.
 * No `product`/`allocation`/`field_state` filtering — `MockPlot` carries no
 * product reference at all (see its own doc comment), and allocation-
 * readiness/field-state are derived per-row below rather than stored, so
 * filtering on them isn't worth reproducing in a mock nobody sees outside
 * dev/E2E.
 */
function filterAssetPlots(rows: MockPlot[], query: Record<string, unknown>): MockPlot[] {
  let result = rows;

  const block = query.block ? String(query.block).toLowerCase() : null;
  if (block) result = result.filter((p) => p.block_label.toLowerCase() === block);

  const status = query.status ? String(query.status) : null;
  if (status) result = result.filter((p) => p.status === status);

  const size = query.size != null ? Number(query.size) : null;
  if (size != null && !Number.isNaN(size)) result = result.filter((p) => p.size === size);

  const search = String(query.search ?? '').trim().toLowerCase();
  if (search) {
    result = result.filter((p) => `${p.block_label}-${p.plot_number}`.toLowerCase().includes(search));
  }

  // `ListPlotsDto.allocation` / `.field_state` on the real backend.
  const allocation = query.allocation ? String(query.allocation) : null;
  if (allocation === 'allocated') result = result.filter((p) => p.status === 'allocated');
  if (allocation === 'unallocated') result = result.filter((p) => p.status !== 'allocated');
  if (allocation === 'allocation_ready') result = result.filter((p) => fieldOpsFor(p).allocation_ready);
  if (allocation === 'not_ready') result = result.filter((p) => !fieldOpsFor(p).allocation_ready);

  const fieldState = query.field_state ? String(query.field_state) : null;
  if (fieldState === 'parcelled') result = result.filter((p) => fieldOpsFor(p).parcelled);
  if (fieldState === 'not_parcelled') result = result.filter((p) => !fieldOpsFor(p).parcelled);
  if (fieldState === 'cleared') result = result.filter((p) => fieldOpsFor(p).clearing_percent >= 100);
  if (fieldState === 'not_cleared') result = result.filter((p) => fieldOpsFor(p).clearing_percent < 100);

  return result;
}

/** Deterministic, plausible field-ops progress — `MockPlot` has no real parcelation/clearing data to read. */
function fieldOpsFor(plot: MockPlot): {
  parcelled: boolean;
  cleared_sqm: number;
  clearing_percent: number;
  allocation_ready: boolean;
  re_pegged_count: number;
  field_events: number;
} {
  const parcelled = plot.plot_number % 3 !== 0;
  const cleared_sqm = parcelled ? plot.size : Math.round(plot.size * 0.4);
  const clearing_percent = plot.size > 0 ? Math.round((cleared_sqm / plot.size) * 10000) / 100 : 0;
  return {
    parcelled,
    cleared_sqm,
    clearing_percent,
    allocation_ready: parcelled && clearing_percent >= 100,
    re_pegged_count: 0,
    field_events: parcelled ? 2 : clearing_percent > 0 ? 1 : 0,
  };
}

function plotInventoryTotals(rows: MockPlot[]) {
  let sqm = 0;
  let parcelled = 0;
  let fullyCleared = 0;
  let clearedSqm = 0;
  let allocated = 0;
  let allocationReady = 0;

  for (const row of rows) {
    const ops = fieldOpsFor(row);
    sqm += row.size;
    clearedSqm += ops.cleared_sqm;
    if (ops.parcelled) parcelled++;
    if (ops.clearing_percent >= 100) fullyCleared++;
    if (row.status === 'allocated') allocated++;
    if (ops.allocation_ready) allocationReady++;
  }

  return {
    plots: rows.length,
    sqm,
    parcelled,
    fully_cleared: fullyCleared,
    cleared_sqm: Math.round(clearedSqm * 100) / 100,
    allocated,
    allocation_ready: allocationReady,
  };
}

/** Mirrors the BE: allocated plots are frozen, and so are the blocks holding them. */
function refuseIfAllocated(plot: MockPlot): void {
  if (plot.status === 'allocated') {
    throw new MockHttpError(
      400,
      'This plot is allocated and cannot be modified or deleted',
      'PLOT_ALLOCATED'
    );
  }
}

export const assetRoutes: MockRoutes = {
  'GET /admin/assets': ({ query }) => {
    const search = String(query.search ?? '').trim().toLowerCase();
    const includeDeleted = String(query.include_deleted ?? '') === 'true';
    const soldOnly = String(query.sold ?? '') === 'true';
    const visibility = query.visibility ? String(query.visibility) : null;
    const offerType = query.offer_type ? String(query.offer_type) : null;

    const rows = assets
      .filter((row) => (includeDeleted ? true : !row.deleted_at))
      .filter((row) => (visibility ? row.visibility === visibility : true))
      .filter((row) => (soldOnly ? row.sold : true))
      // The BE regex-searches name and location.
      .filter((row) =>
        search
          ? row.name.toLowerCase().includes(search) ||
            row.asset_location.toLowerCase().includes(search)
          : true
      )
      .filter((row) =>
        offerType ? row.offers.some((offer) => offer.offer_type === offerType) : true
      )
      // A facet, not a mode switch: matching assets are kept, and each row's
      // offers[] is narrowed to the requested type — as the BE does.
      .map((row) =>
        offerType
          ? { ...row, offers: row.offers.filter((offer) => offer.offer_type === offerType) }
          : row
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return paged(rows, query);
  },

  /**
   * Create — the BE builds the asset and its initial product pools
   * atomically in one transaction, and returns the created document with
   * `offers` as the nested tree (each pool an offer shell with no sizes yet).
   *
   * Not the list-row projection. This route used to return `size_count` /
   * `plan_count` summaries, matching what the create hook then validated
   * against; mock and schema shared one wrong assumption, so mock mode agreed
   * with the bug instead of catching it, and every real create failed with a
   * schema mismatch after succeeding on the server.
   *
   * A mock has to model the endpoint, not the schema someone wrote for it.
   *
   * The new contract (total_land_sqm + product_pools, replacing sales_cap +
   * offers/sizes/plans) is confirmed on the real abode-be-v2 `CreateAssetDto`
   * (PR #82, "phase-1"). Every new-contract asset seeds legacy
   * sales_cap/sold_units/reserved_units at 0 and stays non-purchasable until
   * an authorised migration process assigns real unit capacity; the public
   * API must never infer it from sqm, and neither does this mock.
   */
  'POST /admin/assets': ({ body: raw }) => {
    const dto = body<{
      name?: string;
      asset_location?: string;
      visibility?: MockAsset['visibility'];
      total_land_sqm?: number;
      product_pools?: { offer_type: MockOfferType; assigned_sqm: number }[];
    }>(raw);

    if (!dto.name?.trim()) {
      throw new MockHttpError(400, 'name should not be empty', 'VALIDATION_FAILED');
    }
    if (assets.some((row) => !row.deleted_at && row.name.toLowerCase() === dto.name!.toLowerCase())) {
      throw new MockHttpError(409, 'An asset with this name already exists', 'ASSET_NAME_TAKEN');
    }
    if (!dto.total_land_sqm || dto.total_land_sqm <= 0) {
      throw new MockHttpError(400, 'total_land_sqm must be a positive number', 'TOTAL_LAND_REQUIRED');
    }
    const productPools = dto.product_pools ?? [];
    const assignedSqm = productPools.reduce((total, pool) => total + pool.assigned_sqm, 0);
    if (assignedSqm > dto.total_land_sqm) {
      throw new MockHttpError(
        400,
        `Assigned sqm (${assignedSqm}) exceeds the total estate size (${dto.total_land_sqm})`,
        'LAND_ALLOCATION_EXCEEDS_TOTAL'
      );
    }
    // Every new-contract asset starts at legacy sales_cap 0 (see the route
    // comment above) — public would misrepresent it as available for sale.
    if (dto.visibility === 'public') {
      throw new MockHttpError(
        400,
        'A new asset has no legacy unit inventory yet — keep it draft or internal until migration assigns unit capacity.',
        'VISIBILITY_REQUIRES_LEGACY_CAP'
      );
    }

    const createdId = `665faaaa${String(Date.now()).slice(-16)}`;

    const created = asset({
      _id: createdId,
      name: dto.name.trim(),
      asset_location: dto.asset_location ?? '',
      sales_cap: 0,
      visibility: dto.visibility ?? 'draft',
      total_land_sqm: dto.total_land_sqm,
      // Roads/services, sizes and prices are all still to come on the Offers
      // tab — 'draft', not 'configured', reflects that honestly.
      land_inventory_state: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offers: productPools.map((pool) => ({
        offer_type: pool.offer_type,
        is_active: true,
        size_count: 0,
        plan_count: 0,
      })),
    });

    assets.unshift(created);

    // Register the real tree so the detail page shows what was submitted —
    // an offer shell per product pool, sizes/plans added later on the
    // Offers tab.
    trees[createdId] = productPools.map((pool, offerIndex) => ({
      _id: `${createdId}-offer-${offerIndex}`,
      asset_id: createdId,
      offer_type: pool.offer_type,
      is_active: true,
      allocation_qualification_pct: 0,
      assigned_sqm: pool.assigned_sqm,
      sizes: [],
    }));

    return { ...created, offers: trees[createdId] };
  },

  /**
   * Detail — `{ ...asset, offers: [ { ...offer, sizes: [ { ...size, plans[] } ] } ] }`.
   *
   * The list summary carries counts; this carries the tree. Plans are
   * subdocuments with no `_id`, which is why the API addresses them by tenor.
   */
  'GET /admin/assets/:id': ({ params }) => {
    const row = assets.find((candidate) => candidate._id === params.id);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');

    return { ...row, offers: offerTree(row) };
  },

  /** PUT /admin/assets/:id/pitch-pack — `SetPitchPackDto`; the same link keeps its upload date. */
  'PUT /admin/assets/:id/pitch-pack': ({ params, body: raw }) => {
    const row = assets.find((candidate) => candidate._id === params.id && !candidate.deleted_at);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');
    const dto = body<{ url?: string; size_bytes?: number }>(raw);
    if (!dto.url || !/^https?:\/\/\S+$/i.test(dto.url)) {
      throw new MockHttpError(400, 'url must be an http(s) link to the uploaded file', 'VALIDATION_FAILED');
    }
    const size = Number(dto.size_bytes);
    if (!Number.isInteger(size) || size < 1 || size > 100 * 1024 * 1024) {
      throw new MockHttpError(400, 'size_bytes must be between 1 and 104857600', 'VALIDATION_FAILED');
    }
    const current = row.pitch_pack ?? null;
    row.pitch_pack = {
      url: dto.url,
      size_bytes: size,
      uploaded_at: current?.url === dto.url ? current.uploaded_at : new Date().toISOString(),
    };
    return row.pitch_pack;
  },

  'DELETE /admin/assets/:id/pitch-pack': ({ params }) => {
    const row = assets.find((candidate) => candidate._id === params.id && !candidate.deleted_at);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');
    if (!row.pitch_pack) return { removed: false };
    row.pitch_pack = null;
    return { removed: true };
  },

  /**
   * The detail edit save. Absent until now, so every "Save" on the asset detail
   * page 404'd in mock mode — including the new State field, which is exactly
   * the sort of thing worth being able to try before it reaches production.
   *
   * PATCH semantics, as the BE has them: a key that is present is written, a
   * key that is absent is left alone. `''` is a real value — it is how an admin
   * clears a free-text field — but `state` is validated against the state enum
   * on the server, so the form omits it rather than sending a blank.
   */
  'PATCH /admin/assets/:id': ({ params, body: raw }) => {
    const row = assets.find((candidate) => candidate._id === params.id && !candidate.deleted_at);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');

    const dto = body<Record<string, unknown>>(raw);

    if ('name' in dto && !String(dto.name ?? '').trim()) {
      throw new MockHttpError(400, 'name should not be empty', 'VALIDATION_FAILED');
    }
    if (
      'state' in dto &&
      dto.state !== null &&
      !NIGERIAN_STATES.includes(String(dto.state) as (typeof NIGERIAN_STATES)[number])
    ) {
      throw new MockHttpError(400, 'state must be a Nigerian state', 'VALIDATION_FAILED');
    }

    const WRITABLE = [
      'name',
      'asset_location',
      'state',
      'asset_purpose',
      'topography',
      'amenities',
      'landmark',
      'google_map',
      'description',
      'hero_image',
      'pictures',
      'documents',
      'visibility',
      'sales_cap',
    ];
    for (const key of WRITABLE) {
      if (key in dto) (row as Record<string, unknown>)[key] = dto[key];
    }
    row.updatedAt = new Date().toISOString();

    return { ...row, offers: offerTree(row) };
  },

  /**
   * Offer create landed 2026-07-28 (ticket 18); there is still no delete —
   * `is_active: false` is how an offer is taken out of use.
   */
  'POST /admin/assets/:assetId/offers': ({ params, body: raw }) => {
    const row = assets.find((candidate) => candidate._id === params.assetId && !candidate.deleted_at);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');

    const tree = offerTree(row);
    const dto = body<{
      offer_type: 'flex' | 'full-ownership' | 'commercial';
      is_active?: boolean;
      allocation_qualification_pct?: number;
      payment_type?: string;
      sizes?: {
        size_sqm: number;
        configured_units: number;
        document_fee?: number;
        plans?: MockPlan[];
      }[];
    }>(raw);

    if (tree.some((candidate) => candidate.offer_type === dto.offer_type)) {
      throw new MockHttpError(409, 'This asset already sells that offer type', 'OFFER_ALREADY_EXISTS');
    }
    if (!dto.sizes?.length) {
      throw new MockHttpError(400, 'An offer needs at least one size', 'VALIDATION_FAILED');
    }

    const offerId = `${row._id}-offer-${tree.length}`;
    const offer: MockOffer = {
      _id: offerId,
      asset_id: row._id,
      offer_type: dto.offer_type,
      is_active: dto.is_active ?? true,
      allocation_qualification_pct: dto.allocation_qualification_pct ?? 0,
      ...(dto.payment_type ? { payment_type: dto.payment_type } : {}),
      // This route predates the land account and has no assigned-sqm input
      // of its own (see the Land Account editor milestone for that).
      assigned_sqm: 0,
      sizes: dto.sizes.map((size, sizeIndex) => ({
        _id: `${offerId}-size-${sizeIndex}`,
        offer_id: offerId,
        size_sqm: size.size_sqm,
        configured_units: size.configured_units,
        ...(size.document_fee !== undefined ? { document_fee: size.document_fee } : {}),
        is_active: true,
        plans: (size.plans ?? []).map((plan) => ({ ...plan, is_active: plan.is_active ?? true })),
      })),
    };

    tree.push(offer);
    row.offers.push({
      offer_type: dto.offer_type,
      is_active: offer.is_active,
      size_count: offer.sizes.length,
      plan_count: offer.sizes.reduce((total, size) => total + size.plans.length, 0),
    });

    recordOfferConfigChange(params.assetId, 'add-offer', `Added the ${dto.offer_type} offer with ${offer.sizes.length} size(s)`);
    return offer;
  },

  'PATCH /admin/assets/:assetId/offers/:offerType': ({ params, body: raw }) => {
    const tree = trees[params.assetId];
    const offer = tree?.find((candidate) => candidate.offer_type === params.offerType);
    if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');

    const dto = body<{
      is_active?: boolean;
      allocation_qualification_pct?: number;
      payment_type?: string;
    }>(raw);

    const changes: string[] = [];
    if (dto.is_active !== undefined && dto.is_active !== offer.is_active) {
      changes.push(dto.is_active ? 'reactivated' : 'deactivated');
    }
    if (dto.allocation_qualification_pct !== undefined && dto.allocation_qualification_pct !== offer.allocation_qualification_pct) {
      changes.push(`allocation qualification set to ${dto.allocation_qualification_pct}%`);
    }
    if (dto.payment_type !== undefined && dto.payment_type !== offer.payment_type) {
      changes.push(`payment type set to ${dto.payment_type}`);
    }

    if (dto.is_active !== undefined) offer.is_active = dto.is_active;
    if (dto.allocation_qualification_pct !== undefined) {
      offer.allocation_qualification_pct = dto.allocation_qualification_pct;
    }
    if (dto.payment_type !== undefined) offer.payment_type = dto.payment_type;

    // The list row's offers cell reads is_active, so keep the summary in step.
    const summary = assets
      .find((candidate) => candidate._id === params.assetId)
      ?.offers.find((candidate) => candidate.offer_type === params.offerType);
    if (summary) summary.is_active = offer.is_active;

    if (changes.length > 0) {
      recordOfferConfigChange(params.assetId, 'update-offer', `${OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType}: ${changes.join(', ')}`);
    }
    return offer;
  },

  'POST /admin/assets/:assetId/offers/:offerType/sizes': ({ params, body: raw }) => {
    const offer = trees[params.assetId]?.find(
      (candidate) => candidate.offer_type === params.offerType
    );
    if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');

    const dto = body<{
      size_sqm: number;
      configured_units: number;
      document_fee?: number;
      plans?: MockPlan[];
    }>(raw);

    if (offer.sizes.some((candidate) => candidate.size_sqm === dto.size_sqm)) {
      throw new MockHttpError(409, 'This offer already has that size', 'SIZE_ALREADY_EXISTS');
    }
    assertWithinProductCapacity(offer, OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType, null, {
      size_sqm: dto.size_sqm,
      configured_units: dto.configured_units,
    });

    const size: MockSize = {
      _id: `${offer._id}-size-${offer.sizes.length}-${Date.now() % 10_000}`,
      offer_id: offer._id,
      size_sqm: dto.size_sqm,
      configured_units: dto.configured_units,
      ...(dto.document_fee !== undefined ? { document_fee: dto.document_fee } : {}),
      is_active: true,
      plans: (dto.plans ?? []).map((plan) => ({ ...plan, is_active: plan.is_active ?? true })),
    };

    offer.sizes.push(size);
    syncCounts(params.assetId, params.offerType);
    recordOfferConfigChange(
      params.assetId,
      'add-size',
      `Added a ${dto.size_sqm} sqm size to ${OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType}`
    );
    return size;
  },

  'PATCH /admin/assets/:assetId/offers/:offerType/sizes/:sizeId': ({ params, body: raw }) => {
    const offer = trees[params.assetId]?.find(
      (candidate) => candidate.offer_type === params.offerType
    );
    if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');
    const size = requireSize(params.assetId, params.offerType, params.sizeId);
    const dto = body<{
      size_sqm?: number;
      configured_units?: number;
      document_fee?: number;
      is_active?: boolean;
      plans?: MockPlan[];
    }>(raw);

    if (dto.size_sqm !== undefined || dto.configured_units !== undefined) {
      assertWithinProductCapacity(offer, OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType, size._id, {
        size_sqm: dto.size_sqm ?? size.size_sqm,
        configured_units: dto.configured_units ?? size.configured_units,
      });
    }

    const label = OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType;
    const changes: string[] = [];
    if (dto.size_sqm !== undefined && dto.size_sqm !== size.size_sqm) changes.push(`size ${size.size_sqm} → ${dto.size_sqm} sqm`);
    if (dto.configured_units !== undefined && dto.configured_units !== size.configured_units) {
      changes.push(`configured units ${size.configured_units} → ${dto.configured_units}`);
    }
    if (dto.document_fee !== undefined && dto.document_fee !== size.document_fee) changes.push('document fee updated');
    if (dto.is_active !== undefined && dto.is_active !== size.is_active) changes.push(dto.is_active ? 'reactivated' : 'deactivated');

    if (dto.size_sqm !== undefined) size.size_sqm = dto.size_sqm;
    if (dto.configured_units !== undefined) size.configured_units = dto.configured_units;
    if (dto.document_fee !== undefined) size.document_fee = dto.document_fee;
    if (dto.is_active !== undefined) size.is_active = dto.is_active;
    // A full replacement, exactly like the BE — this is the tenor-edit path.
    if (dto.plans !== undefined) {
      size.plans = dto.plans.map((plan) => ({ ...plan, is_active: plan.is_active ?? true }));
    }

    syncCounts(params.assetId, params.offerType);
    if (dto.plans !== undefined) {
      recordOfferConfigChange(params.assetId, 'update-plan', `${label}, ${size.size_sqm} sqm: tenor changed, replacing the size's plans`);
    } else if (changes.length > 0) {
      recordOfferConfigChange(params.assetId, 'update-size', `${label}, ${size.size_sqm} sqm: ${changes.join(', ')}`);
    }
    return size;
  },

  'DELETE /admin/assets/:assetId/offers/:offerType/sizes/:sizeId': ({ params }) => {
    const offer = trees[params.assetId]?.find(
      (candidate) => candidate.offer_type === params.offerType
    );
    if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');
    const size = requireSize(params.assetId, params.offerType, params.sizeId);

    offer.sizes = offer.sizes.filter((candidate) => candidate._id !== params.sizeId);
    syncCounts(params.assetId, params.offerType);
    recordOfferConfigChange(
      params.assetId,
      'delete-size',
      `Deleted the ${size.size_sqm} sqm size from ${OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType}`
    );
    return { message: 'Size deleted' };
  },

  /** Ticket 19's add half (2026-07-28) — one plan, refused on a duplicate tenor. */
  'POST /admin/assets/:assetId/offers/:offerType/sizes/:sizeId/plans': ({ params, body: raw }) => {
    const size = requireSize(params.assetId, params.offerType, params.sizeId);
    const dto = body<MockPlan>(raw);

    if (size.plans.some((candidate) => candidate.tenor_months === dto.tenor_months)) {
      throw new MockHttpError(409, 'This size already has a plan at that tenor', 'TENOR_ALREADY_EXISTS');
    }

    size.plans.push({ ...dto, is_active: dto.is_active ?? true });
    size.plans.sort((a, b) => a.tenor_months - b.tenor_months);
    syncCounts(params.assetId, params.offerType);
    recordOfferConfigChange(
      params.assetId,
      'add-plan',
      `Added a ${dto.tenor_months === 0 ? 'outright' : `${dto.tenor_months}-month`} plan to ${OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType}, ${size.size_sqm} sqm`
    );
    return size;
  },

  'PATCH /admin/assets/:assetId/offers/:offerType/sizes/:sizeId/plans/:tenor': ({ params, body: raw }) => {
    const size = requireSize(params.assetId, params.offerType, params.sizeId);
    const plan = size.plans.find((candidate) => candidate.tenor_months === Number(params.tenor));
    if (!plan) throw new MockHttpError(404, 'Plan not found', 'PLAN_NOT_FOUND');

    const dto = body<Partial<MockPlan>>(raw);
    const changes: string[] = [];
    if (dto.land_price !== undefined && dto.land_price !== plan.land_price) changes.push('land price updated');
    if (dto.initial_payment !== undefined && dto.initial_payment !== plan.initial_payment) changes.push('initial payment updated');
    if (dto.monthly_installment !== undefined && dto.monthly_installment !== plan.monthly_installment) changes.push('monthly instalment updated');
    if (dto.is_promo !== undefined && dto.is_promo !== plan.is_promo) changes.push(dto.is_promo ? 'marked promo' : 'unmarked promo');
    if (dto.is_active !== undefined && dto.is_active !== plan.is_active) changes.push(dto.is_active ? 'reactivated' : 'deactivated');

    if (dto.land_price !== undefined) plan.land_price = dto.land_price;
    if (dto.initial_payment !== undefined) plan.initial_payment = dto.initial_payment;
    if (dto.monthly_installment !== undefined) plan.monthly_installment = dto.monthly_installment;
    if (dto.is_promo !== undefined) plan.is_promo = dto.is_promo;
    if (dto.is_active !== undefined) plan.is_active = dto.is_active;

    if (changes.length > 0) {
      const label = OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType;
      const tenorLabel = plan.tenor_months === 0 ? 'outright' : `${plan.tenor_months}-month`;
      recordOfferConfigChange(params.assetId, 'update-plan', `${label} ${tenorLabel} plan: ${changes.join(', ')}`);
    }
    return plan;
  },

  'DELETE /admin/assets/:assetId/offers/:offerType/sizes/:sizeId/plans/:tenor': ({ params }) => {
    const size = requireSize(params.assetId, params.offerType, params.sizeId);
    const tenor = Number(params.tenor);
    if (!size.plans.some((candidate) => candidate.tenor_months === tenor)) {
      throw new MockHttpError(404, 'Plan not found', 'PLAN_NOT_FOUND');
    }
    if (size.plans.length <= 1) {
      throw new MockHttpError(409, "Can't delete a size's only plan", 'LAST_PLAN');
    }

    size.plans = size.plans.filter((candidate) => candidate.tenor_months !== tenor);
    syncCounts(params.assetId, params.offerType);
    recordOfferConfigChange(
      params.assetId,
      'delete-plan',
      `Deleted the ${tenor === 0 ? 'outright' : `${tenor}-month`} plan from ${OFFER_TYPE_DISPLAY_LABELS[params.offerType] ?? params.offerType}, ${size.size_sqm} sqm`
    );
    return { message: 'Plan deleted' };
  },

  /* -------------------- blocks -------------------- */

  'GET /admin/assets/:assetId/blocks': ({ params }) =>
    blocks.filter((block) => block.asset === params.assetId),

  'POST /admin/assets/:assetId/blocks': ({ params, body: raw }) => {
    const dto = body<{ label?: string; description?: string }>(raw);
    const label = String(dto.label ?? '').trim().toUpperCase();
    if (!label) throw new MockHttpError(400, 'label must be at least 1 character', 'VALIDATION_FAILED');

    const clash = blocks.some(
      (block) => block.asset === params.assetId && block.label.toUpperCase() === label
    );
    if (clash) {
      throw new MockHttpError(409, `Block "${label}" already exists on this asset`, 'DUPLICATE_BLOCK');
    }

    blockSeq += 1;
    const block: MockBlock = {
      _id: `665fbb0000000000000n${String(blockSeq).padStart(2, '0')}`,
      asset: params.assetId,
      label,
      description: dto.description,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    blocks.push(block);
    return block;
  },

  'PATCH /admin/blocks/:blockId': ({ params, body: raw }) => {
    const block = requireBlock(params.blockId);
    const dto = body<{ label?: string; description?: string }>(raw);
    if (dto.label !== undefined) block.label = String(dto.label).trim().toUpperCase();
    if (dto.description !== undefined) block.description = dto.description;
    block.updatedAt = nowIso();
    return block;
  },

  'DELETE /admin/blocks/:blockId': ({ params }) => {
    const block = requireBlock(params.blockId);
    const held = plots.filter((plot) => plot.block === block._id);
    if (held.some((plot) => plot.status === 'allocated')) {
      throw new MockHttpError(
        400,
        'This block has allocated plots and cannot be modified or deleted',
        'BLOCK_HAS_ALLOCATED_PLOTS'
      );
    }

    for (const plot of held) plots.splice(plots.indexOf(plot), 1);
    blocks.splice(blocks.indexOf(block), 1);
    return block;
  },

  /* -------------------- plots -------------------- */

  'GET /admin/blocks/:blockId/plots': ({ params }) =>
    plots
      .filter((plot) => plot.block === params.blockId)
      .sort((a, b) => a.plot_number - b.plot_number),

  /** POST /admin/blocks/:block_id/plots — one plot (`CreatePlotDto`), same rules as a bulk row. */
  'POST /admin/blocks/:blockId/plots': ({ params, body: raw }) => {
    const block = requireBlock(params.blockId);
    const dto = body<{ plot_number?: number; size?: number }>(raw);
    const plotNumber = Number(dto.plot_number);
    const size = Number(dto.size);
    if (!Number.isInteger(plotNumber) || plotNumber < 1 || !Number.isInteger(size) || size < 1) {
      throw new MockHttpError(400, 'plot_number and size must be integers of at least 1', 'VALIDATION_FAILED');
    }
    if (plots.some((plot) => plot.block === block._id && plot.plot_number === plotNumber)) {
      throw new MockHttpError(409, `Plot ${plotNumber} already exists in this block`, 'DUPLICATE_PLOT');
    }

    plotSeq += 1;
    const plot: MockPlot = {
      _id: `665fcp00000000000000n${String(plotSeq).padStart(2, '0')}`,
      block: block._id,
      block_label: block.label,
      plot_number: plotNumber,
      size,
      status: 'available',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    plots.push(plot);
    return plot;
  },

  'POST /admin/blocks/:blockId/plots/bulk': ({ params, body: raw }) => {
    const block = requireBlock(params.blockId);
    const dto = body<{ plots?: Array<{ plot_number?: number; size?: number }> }>(raw);
    const incoming = dto.plots ?? [];
    if (incoming.length === 0) {
      throw new MockHttpError(400, 'plots should not be empty', 'VALIDATION_FAILED');
    }

    const taken = new Set(
      plots.filter((plot) => plot.block === block._id).map((plot) => plot.plot_number)
    );

    const created = incoming.map((draft) => {
      const plotNumber = Number(draft.plot_number);
      const size = Number(draft.size);
      if (!Number.isInteger(plotNumber) || plotNumber < 1 || !Number.isInteger(size) || size < 1) {
        throw new MockHttpError(400, 'plot_number and size must be integers of at least 1', 'VALIDATION_FAILED');
      }
      if (taken.has(plotNumber)) {
        throw new MockHttpError(409, `Plot ${plotNumber} already exists in this block`, 'DUPLICATE_PLOT');
      }
      taken.add(plotNumber);

      plotSeq += 1;
      const plot: MockPlot = {
        _id: `665fcp00000000000000n${String(plotSeq).padStart(2, '0')}`,
        block: block._id,
        block_label: block.label,
        plot_number: plotNumber,
        size,
        status: 'available',
        payment_plan: null,
        allocated_date: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      plots.push(plot);
      return plot;
    });

    return created;
  },

  'PATCH /admin/plots/:plotId': ({ params, body: raw }) => {
    const plot = requirePlot(params.plotId);
    refuseIfAllocated(plot);

    const dto = body<{ plot_number?: number; size?: number }>(raw);
    if (dto.plot_number !== undefined) {
      const next = Number(dto.plot_number);
      const clash = plots.some(
        (candidate) =>
          candidate.block === plot.block &&
          candidate._id !== plot._id &&
          candidate.plot_number === next
      );
      if (clash) {
        throw new MockHttpError(409, `Plot ${next} already exists in this block`, 'DUPLICATE_PLOT');
      }
      plot.plot_number = next;
    }
    if (dto.size !== undefined) plot.size = Number(dto.size);
    plot.updatedAt = nowIso();
    return plot;
  },

  'DELETE /admin/plots/:plotId': ({ params }) => {
    const plot = requirePlot(params.plotId);
    refuseIfAllocated(plot);
    plots.splice(plots.indexOf(plot), 1);
    return plot;
  },

  /* -------------------- ground confirmation -------------------- */

  'GET /admin/plots/:plotId/ground-confirmation': ({ params }) => {
    requirePlot(params.plotId);
    return [...(groundConfirmationsByPlot[params.plotId] ?? [])].sort((a, b) =>
      a.submitted_at < b.submitted_at ? 1 : -1
    );
  },

  'POST /admin/plots/:plotId/ground-confirmation': ({ params, body: raw }) => {
    const plot = requirePlot(params.plotId);
    const dto = body<{ notes?: string }>(raw);

    groundConfirmationSeq += 1;
    const confirmation: MockGroundConfirmation = {
      _id: `gc-${String(groundConfirmationSeq).padStart(4, '0')}`,
      plot_id: plot._id,
      submitted_by: MOCK_SITE_MANAGER_NAME,
      submitted_at: nowIso(),
      verified_by: null,
      verified_at: null,
      notes: dto.notes?.trim() || null,
    };
    groundConfirmationsByPlot[plot._id] = [...(groundConfirmationsByPlot[plot._id] ?? []), confirmation];
    return confirmation;
  },

  /** An admin confirms a field submission in person — this is what makes a plot "Ground confirmed", not the submission alone. */
  'POST /admin/plots/:plotId/ground-confirmation/:confirmationId/verify': ({ params }) => {
    const plot = requirePlot(params.plotId);
    const confirmation = (groundConfirmationsByPlot[plot._id] ?? []).find(
      (candidate) => candidate._id === params.confirmationId
    );
    if (!confirmation) throw new MockHttpError(404, 'Ground confirmation not found', 'GROUND_CONFIRMATION_NOT_FOUND');
    if (confirmation.verified_at) {
      throw new MockHttpError(409, 'This confirmation has already been verified', 'ALREADY_VERIFIED');
    }

    confirmation.verified_by = MOCK_ADMIN_NAME;
    confirmation.verified_at = nowIso();
    return confirmation;
  },

  /* -------------------- asset-wide plot inventory -------------------- */

  /**
   * GET /admin/assets/:assetId/plots — confirmed REAL against `abode-be-v2`
   * staging's field-staff module (`AssetSiteSetupController`'s `plots()`,
   * `SiteSetupService.plotInventory()`) — see plot-inventory.schema.ts's
   * header for the full shape this mirrors. One response carries the list,
   * BOTH totals (unfiltered and filtered), and allocation-readiness together.
   * An asset with no blocks (e.g. Harmony Gardens) returns a genuinely empty list, not
   * an error.
   */
  'GET /admin/assets/:assetId/plots': ({ params, query }) => {
    const asset = findActiveAsset(params.assetId);
    if (!asset) throw new MockHttpError(404, 'Asset not found', 'FIELD_SITE_NOT_FOUND');

    const all = assetPlots(params.assetId);
    const filtered = filterAssetPlots(all, query).sort(
      (a, b) => a.block_label.localeCompare(b.block_label) || a.plot_number - b.plot_number
    );

    const page = Number(query.page ?? 1) || 1;
    const limit = Math.min(200, Number(query.limit ?? 50) || 50);
    const rows = filtered.slice((page - 1) * limit, page * limit);

    return {
      data: {
        asset: { id: params.assetId, name: asset.name },
        plots: rows.map((p) => {
          const ops = fieldOpsFor(p);
          return {
            id: p._id,
            label: `${p.block_label}-${p.plot_number}`,
            block: p.block_label,
            plot_number: p.plot_number,
            size_sqm: p.size,
            commercial_status: p.status,
            product: null,
            payment_plan_id: p.payment_plan ?? null,
            allocated_date: p.allocated_date ?? null,
            parcelled: ops.parcelled,
            re_pegged_count: ops.re_pegged_count,
            cleared_sqm: ops.cleared_sqm,
            clearing_percent: ops.clearing_percent,
            allocation_ready: ops.allocation_ready,
            field_events: ops.field_events,
          };
        }),
        totals: plotInventoryTotals(all),
        filtered_totals: plotInventoryTotals(filtered),
        allocation_readiness: {
          plots_ready: filtered.filter((p) => fieldOpsFor(p).allocation_ready).length,
          plots_not_ready: filtered.filter((p) => !fieldOpsFor(p).allocation_ready).length,
          upcoming_event: null,
          latest_completed_event: null,
          note: 'No allocation event is scheduled, so there is no event capacity to report',
        },
      },
      meta: { total: filtered.length, page, limit, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) },
    };
  },

  /**
   * GET /admin/assets/:assetId/plots/summary — real since abode-be-v2 commit
   * 0f042ef (`SiteSetupService.plotSummary()`): the response above without
   * the `plots` rows, under the same filters.
   */
  'GET /admin/assets/:assetId/plots/summary': ({ params, query }) => {
    const asset = findActiveAsset(params.assetId);
    if (!asset) throw new MockHttpError(404, 'Asset not found', 'FIELD_SITE_NOT_FOUND');

    const all = assetPlots(params.assetId);
    const filtered = filterAssetPlots(all, query);

    return {
      asset: { id: params.assetId, name: asset.name },
      totals: plotInventoryTotals(all),
      filtered_totals: plotInventoryTotals(filtered),
      allocation_readiness: {
        plots_ready: all.filter((p) => fieldOpsFor(p).allocation_ready).length,
        plots_not_ready: all.filter((p) => !fieldOpsFor(p).allocation_ready).length,
        upcoming_event: null,
        latest_completed_event: null,
        note: 'No allocation event is scheduled, so there is no event capacity to report',
      },
    };
  },

  /** "Preserve offer configuration history" — newest first, like every other history route in this feature. */
  'GET /admin/assets/:assetId/offers/history': ({ params, query }) => {
    const revisions = [...(offerConfigHistory[params.assetId] ?? [])].sort((a, b) => b.version - a.version);
    return paged(revisions, query, 50);
  },

  /** Soft delete — sets `deleted_at`, keeps the row. */
  'DELETE /admin/assets/:id': ({ params }) => {
    const row = assets.find((candidate) => candidate._id === params.id);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');

    row.deleted_at = new Date().toISOString();
    return { message: 'Asset deleted' };
  },
};

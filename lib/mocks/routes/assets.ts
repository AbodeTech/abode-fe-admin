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

type MockOfferSummary = {
  offer_type: 'flex' | 'full-ownership' | 'commercial';
  is_active: boolean;
  size_count: number;
  plan_count: number;
};

type MockAsset = {
  _id: string;
  name: string;
  asset_location: string;
  google_map: string | null;
  description: string;
  amenities: string[];
  landmark: string[];
  topography: string | null;
  asset_purpose: string | null;
  hero_image: string | null;
  pictures: string[];
  documents: Record<string, string | undefined>;
  asset_history: { year: number; value: number }[];
  sales_cap: number;
  sold_units: number;
  reserved_units: number;
  available_units: number;
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
    asset_history: [],
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

const assets: MockAsset[] = [
  // All three offer types on one asset — impossible in v1's model.
  asset({
    _id: '665faaaa00000000000000a1',
    name: 'Aviation City',
    asset_location: 'Ibeju-Lekki, Lagos',
    sales_cap: 480,
    sold_units: 312,
    reserved_units: 24,
    offers: [
      { offer_type: 'flex', is_active: true, size_count: 3, plan_count: 9 },
      { offer_type: 'full-ownership', is_active: true, size_count: 2, plan_count: 4 },
      { offer_type: 'commercial', is_active: true, size_count: 2, plan_count: 4 },
    ],
    createdAt: daysAgo(210),
  }),
  asset({
    _id: '665faaaa00000000000000a2',
    name: 'Harmony Gardens',
    asset_location: 'Epe, Lagos',
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

/* -------------------- the detail tree -------------------- */

type MockPlan = {
  tenor_months: number;
  land_price: number;
  initial_payment: number;
  monthly_installment: number;
  is_promo?: boolean;
  is_active: boolean;
};

type MockSize = {
  _id: string;
  offer_id: string;
  size_sqm: number;
  units_available: number;
  document_fee?: number;
  is_active: boolean;
  plans: MockPlan[];
};

type MockOffer = {
  _id: string;
  asset_id: string;
  offer_type: string;
  is_active: boolean;
  allocation_qualification_pct: number;
  payment_type?: string;
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
  };
}

const outrightPlan = (landPrice: number): MockPlan => ({
  tenor_months: 0,
  land_price: landPrice,
  initial_payment: landPrice,
  monthly_installment: 0,
  is_active: true,
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

function requireSize(assetId: string, offerType: string, sizeId: string): MockSize {
  const offer = trees[assetId]?.find((candidate) => candidate.offer_type === offerType);
  if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');
  const size = offer.sizes.find((candidate) => candidate._id === sizeId);
  if (!size) throw new MockHttpError(404, 'Size not found', 'SIZE_NOT_FOUND');
  return size;
}

function offerTree(row: MockAsset): MockOffer[] {
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
        units_available: 12 - sizeIndex * 3,
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
      sizes,
    };
  });

  return trees[row._id];
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
   * Create — the BE builds asset, offers, sizes and plans atomically in one
   * transaction, and returns the asset. Only the offer *summary* comes back on
   * the asset itself, so that is what the mock derives.
   */
  /**
   * Create — returns the **created document**, `offers` as the nested tree.
   *
   * Not the list-row projection. This route used to return `size_count` /
   * `plan_count` summaries, matching what the create hook then validated
   * against; mock and schema shared one wrong assumption, so mock mode agreed
   * with the bug instead of catching it, and every real create failed with a
   * schema mismatch after succeeding on the server.
   *
   * A mock has to model the endpoint, not the schema someone wrote for it.
   */
  'POST /admin/assets': ({ body: raw }) => {
    const dto = body<{
      name?: string;
      asset_location?: string;
      sales_cap?: number;
      visibility?: MockAsset['visibility'];
      offers?: {
        offer_type: 'flex' | 'full-ownership' | 'commercial';
        is_active?: boolean;
        allocation_qualification_pct?: number;
        payment_type?: string;
        sizes?: {
          size_sqm: number;
          units_available: number;
          document_fee?: number;
          plans?: MockPlan[];
        }[];
      }[];
    }>(raw);

    if (!dto.name?.trim()) {
      throw new MockHttpError(400, 'name should not be empty', 'VALIDATION_FAILED');
    }
    if (assets.some((row) => !row.deleted_at && row.name.toLowerCase() === dto.name!.toLowerCase())) {
      throw new MockHttpError(409, 'An asset with this name already exists', 'ASSET_NAME_TAKEN');
    }

    const created = asset({
      _id: `665faaaa${String(Date.now()).slice(-16)}`,
      name: dto.name.trim(),
      asset_location: dto.asset_location ?? '',
      sales_cap: dto.sales_cap ?? 0,
      visibility: dto.visibility ?? 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offers: (dto.offers ?? []).map((offer) => ({
        offer_type: offer.offer_type,
        is_active: offer.is_active ?? true,
        size_count: offer.sizes?.length ?? 0,
        plan_count: (offer.sizes ?? []).reduce(
          (total, size) => total + (size.plans?.length ?? 0),
          0
        ),
      })),
    });

    assets.unshift(created);

    // Register the real tree so the detail page shows what was submitted.
    // Without this, `offerTree` would lazily synthesize sizes and plans from
    // the summary counts and the admin would land on an asset whose prices
    // they never entered.
    trees[created._id] = (dto.offers ?? []).map((offer, offerIndex) => {
      const offerId = `${created._id}-offer-${offerIndex}`;
      return {
        _id: offerId,
        asset_id: created._id,
        offer_type: offer.offer_type,
        is_active: offer.is_active ?? true,
        allocation_qualification_pct: offer.allocation_qualification_pct ?? 0,
        ...(offer.payment_type ? { payment_type: offer.payment_type } : {}),
        sizes: (offer.sizes ?? []).map((size, sizeIndex) => ({
          _id: `${offerId}-size-${sizeIndex}`,
          offer_id: offerId,
          size_sqm: size.size_sqm,
          units_available: size.units_available,
          ...(size.document_fee !== undefined ? { document_fee: size.document_fee } : {}),
          is_active: true,
          plans: (size.plans ?? []).map((plan) => ({ ...plan, is_active: plan.is_active ?? true })),
        })),
      };
    });

    return { ...created, offers: trees[created._id] };
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
        units_available: number;
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
      sizes: dto.sizes.map((size, sizeIndex) => ({
        _id: `${offerId}-size-${sizeIndex}`,
        offer_id: offerId,
        size_sqm: size.size_sqm,
        units_available: size.units_available,
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

    return offer;
  },

  'POST /admin/assets/:assetId/offers/:offerType/sizes': ({ params, body: raw }) => {
    const offer = trees[params.assetId]?.find(
      (candidate) => candidate.offer_type === params.offerType
    );
    if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');

    const dto = body<{
      size_sqm: number;
      units_available: number;
      document_fee?: number;
      plans?: MockPlan[];
    }>(raw);

    if (offer.sizes.some((candidate) => candidate.size_sqm === dto.size_sqm)) {
      throw new MockHttpError(409, 'This offer already has that size', 'SIZE_ALREADY_EXISTS');
    }

    const size: MockSize = {
      _id: `${offer._id}-size-${offer.sizes.length}-${Date.now() % 10_000}`,
      offer_id: offer._id,
      size_sqm: dto.size_sqm,
      units_available: dto.units_available,
      ...(dto.document_fee !== undefined ? { document_fee: dto.document_fee } : {}),
      is_active: true,
      plans: (dto.plans ?? []).map((plan) => ({ ...plan, is_active: plan.is_active ?? true })),
    };

    offer.sizes.push(size);
    syncCounts(params.assetId, params.offerType);
    return size;
  },

  'PATCH /admin/assets/:assetId/offers/:offerType/sizes/:sizeId': ({ params, body: raw }) => {
    const size = requireSize(params.assetId, params.offerType, params.sizeId);
    const dto = body<{
      size_sqm?: number;
      units_available?: number;
      document_fee?: number;
      is_active?: boolean;
      plans?: MockPlan[];
    }>(raw);

    if (dto.size_sqm !== undefined) size.size_sqm = dto.size_sqm;
    if (dto.units_available !== undefined) size.units_available = dto.units_available;
    if (dto.document_fee !== undefined) size.document_fee = dto.document_fee;
    if (dto.is_active !== undefined) size.is_active = dto.is_active;
    // A full replacement, exactly like the BE — this is the tenor-edit path.
    if (dto.plans !== undefined) {
      size.plans = dto.plans.map((plan) => ({ ...plan, is_active: plan.is_active ?? true }));
    }

    syncCounts(params.assetId, params.offerType);
    return size;
  },

  'DELETE /admin/assets/:assetId/offers/:offerType/sizes/:sizeId': ({ params }) => {
    const offer = trees[params.assetId]?.find(
      (candidate) => candidate.offer_type === params.offerType
    );
    if (!offer) throw new MockHttpError(404, 'Offer not found', 'OFFER_NOT_FOUND');
    requireSize(params.assetId, params.offerType, params.sizeId);

    offer.sizes = offer.sizes.filter((candidate) => candidate._id !== params.sizeId);
    syncCounts(params.assetId, params.offerType);
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
    return size;
  },

  'PATCH /admin/assets/:assetId/offers/:offerType/sizes/:sizeId/plans/:tenor': ({ params, body: raw }) => {
    const size = requireSize(params.assetId, params.offerType, params.sizeId);
    const plan = size.plans.find((candidate) => candidate.tenor_months === Number(params.tenor));
    if (!plan) throw new MockHttpError(404, 'Plan not found', 'PLAN_NOT_FOUND');

    const dto = body<Partial<MockPlan>>(raw);
    if (dto.land_price !== undefined) plan.land_price = dto.land_price;
    if (dto.initial_payment !== undefined) plan.initial_payment = dto.initial_payment;
    if (dto.monthly_installment !== undefined) plan.monthly_installment = dto.monthly_installment;
    if (dto.is_promo !== undefined) plan.is_promo = dto.is_promo;
    if (dto.is_active !== undefined) plan.is_active = dto.is_active;

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

  /** Soft delete — sets `deleted_at`, keeps the row. */
  'DELETE /admin/assets/:id': ({ params }) => {
    const row = assets.find((candidate) => candidate._id === params.id);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');

    row.deleted_at = new Date().toISOString();
    return { message: 'Asset deleted' };
  },
};

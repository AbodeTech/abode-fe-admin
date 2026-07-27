import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Assets — the assets domain owns /admin/assets/*.
 *
 * Rows match what `asset.service.findAll` returns: the full asset document
 * plus an `offers[]` summary aggregated across both size collections.
 *
 * Note the fixtures deliberately include an asset carrying **both** offer
 * types, one with an inactive offer, a draft, a sold-out, and a soft-deleted
 * one — the states the single table exists to render, none of which v1's two
 * tables could express.
 *
 * Money is decimal naira.
 * ============================================================ */

type MockOfferSummary = {
  offer_type: 'flex' | 'full-ownership';
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
  // Both offer types on one asset — impossible in v1's model.
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
        offer_type: 'flex' | 'full-ownership';
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

  /** The only offer-level write — no create, no delete (⛔ ticket 18). */
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

  /** Soft delete — sets `deleted_at`, keeps the row. */
  'DELETE /admin/assets/:id': ({ params }) => {
    const row = assets.find((candidate) => candidate._id === params.id);
    if (!row) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');

    row.deleted_at = new Date().toISOString();
    return { message: 'Asset deleted' };
  },
};

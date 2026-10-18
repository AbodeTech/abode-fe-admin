import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';
import { findPerson } from './people';

/* ============================================================
 * Marketplace mocks — /admin/marketplace/listings, pending-approvals,
 * stats, and the four listing actions.
 *
 * `adminGetAllListings`/`adminGetPendingApprovals` call `findAllPaginated`,
 * which does NOT `.populate()` — seller/buyer/asset arrive as bare id
 * strings on list rows. The four action endpoints (approve/reject/suspend/
 * unsuspend) return the listing via `findById`, which populates `asset` and
 * `seller` but never `buyer`. This file mirrors that split deliberately —
 * see docs/BACKEND-REQUESTS.md #27 — rather than populating everything for
 * a nicer-looking mock.
 * ============================================================ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type MockAssetRef = { _id: string; name: string; asset_location: string };

const MOCK_ASSETS: Record<string, MockAssetRef> = {
  '665faaaa00000000000000a1': {
    _id: '665faaaa00000000000000a1',
    name: 'Aviation City',
    asset_location: 'Ibeju-Lekki, Lagos',
  },
  '665faaaa00000000000000a2': {
    _id: '665faaaa00000000000000a2',
    name: 'Harmony Gardens',
    asset_location: 'Kuje, Abuja',
  },
};

type MockListingStatus =
  | 'active'
  | 'pending_payment'
  | 'pending_approval'
  | 'sold'
  | 'cancelled'
  | 'expired'
  | 'suspended';

type MockListing = {
  _id: string;
  seller: string;
  buyer: string | null;
  payment_plan: string;
  asset: string;
  unique_asset_id: string;
  asset_type: 'co-ownership' | 'flex' | 'full-ownership' | 'land-banking';
  no_of_units: number;
  size: number | null;
  listing_price: number;
  commission_percentage: number;
  platform_fee: number;
  referral_commission_gross: number;
  seller_proceeds: number;
  listing_description: string | null;
  reason_for_selling: string | null;
  status: MockListingStatus;
  receipt_image: string | null;
  receipt_reference: string | null;
  receipt_amount: number | null;
  listed_at: string;
  expires_at: string;
  claimed_at: string | null;
  sold_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  is_auto_cancelled: boolean;
  createdAt: string;
  updatedAt: string;
};

const listings: MockListing[] = [
  {
    _id: '665fmp0000000000000000m1',
    seller: '665fcccc00000000000000c1', // John Okafor
    buyer: null,
    payment_plan: '665fplan000000000000pl01',
    asset: '665faaaa00000000000000a1',
    unique_asset_id: 'AVC-FL-014',
    asset_type: 'flex',
    no_of_units: 2,
    size: null,
    listing_price: 4_200_000,
    commission_percentage: 5,
    platform_fee: 210_000,
    referral_commission_gross: 84_000,
    seller_proceeds: 3_990_000,
    listing_description: 'Two flex units, fully paid, transferring for relocation.',
    reason_for_selling: 'Relocating out of Lagos',
    status: 'active',
    receipt_image: null,
    receipt_reference: null,
    receipt_amount: null,
    listed_at: daysAgo(6),
    expires_at: daysAgo(-24),
    claimed_at: null,
    sold_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    suspended_at: null,
    suspended_reason: null,
    is_auto_cancelled: false,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    _id: '665fmp0000000000000000m2',
    seller: '665fcccc00000000000000c2', // second PEOPLE fixture
    buyer: '665fcccc00000000000000c3',
    payment_plan: '665fplan000000000000pl02',
    asset: '665faaaa00000000000000a2',
    unique_asset_id: 'HG-FO-007',
    asset_type: 'full-ownership',
    no_of_units: 1,
    size: 300,
    listing_price: 8_500_000,
    commission_percentage: 5,
    platform_fee: 425_000,
    referral_commission_gross: 0,
    seller_proceeds: 8_075_000,
    listing_description: '300sqm full-ownership plot, all documents ready.',
    reason_for_selling: null,
    status: 'pending_approval',
    receipt_image: 'https://res.cloudinary.com/demo/image/upload/receipt-sample-1.jpg',
    receipt_reference: 'MKT-REC-88213',
    receipt_amount: 8_500_000,
    listed_at: daysAgo(9),
    expires_at: daysAgo(-21),
    claimed_at: daysAgo(1),
    sold_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    suspended_at: null,
    suspended_reason: null,
    is_auto_cancelled: false,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(1),
  },
  {
    _id: '665fmp0000000000000000m3',
    seller: '665fcccc00000000000000c1',
    buyer: '665fcccc00000000000000c2',
    payment_plan: '665fplan000000000000pl03',
    asset: '665faaaa00000000000000a1',
    unique_asset_id: 'AVC-FL-009',
    asset_type: 'flex',
    no_of_units: 1,
    size: null,
    listing_price: 2_100_000,
    commission_percentage: 5,
    platform_fee: 105_000,
    referral_commission_gross: 42_000,
    seller_proceeds: 1_995_000,
    listing_description: null,
    reason_for_selling: null,
    status: 'sold',
    receipt_image: null,
    receipt_reference: null,
    receipt_amount: null,
    listed_at: daysAgo(30),
    expires_at: daysAgo(0),
    claimed_at: daysAgo(15),
    sold_at: daysAgo(14),
    cancelled_at: null,
    cancellation_reason: null,
    suspended_at: null,
    suspended_reason: null,
    is_auto_cancelled: false,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(14),
  },
  {
    _id: '665fmp0000000000000000m4',
    seller: '665fcccc00000000000000c2',
    buyer: null,
    payment_plan: '665fplan000000000000pl04',
    asset: '665faaaa00000000000000a2',
    unique_asset_id: 'HG-FO-012',
    asset_type: 'full-ownership',
    no_of_units: 1,
    size: 500,
    listing_price: 12_000_000,
    commission_percentage: 5,
    platform_fee: 600_000,
    referral_commission_gross: 0,
    seller_proceeds: 11_400_000,
    listing_description: null,
    reason_for_selling: 'Buyer defaulted on the receipt review',
    status: 'cancelled',
    receipt_image: null,
    receipt_reference: null,
    receipt_amount: null,
    listed_at: daysAgo(20),
    expires_at: daysAgo(-10),
    claimed_at: null,
    sold_at: null,
    cancelled_at: daysAgo(5),
    cancellation_reason: 'Seller withdrew the listing',
    suspended_at: null,
    suspended_reason: null,
    is_auto_cancelled: false,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
  },
  {
    _id: '665fmp0000000000000000m5',
    seller: '665fcccc00000000000000c1',
    buyer: null,
    payment_plan: '665fplan000000000000pl05',
    asset: '665faaaa00000000000000a1',
    unique_asset_id: 'AVC-FL-002',
    asset_type: 'flex',
    no_of_units: 3,
    size: null,
    listing_price: 5_800_000,
    commission_percentage: 5,
    platform_fee: 290_000,
    referral_commission_gross: 58_000,
    seller_proceeds: 5_510_000,
    listing_description: null,
    reason_for_selling: null,
    status: 'expired',
    receipt_image: null,
    receipt_reference: null,
    receipt_amount: null,
    listed_at: daysAgo(45),
    expires_at: daysAgo(15),
    claimed_at: null,
    sold_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    suspended_at: null,
    suspended_reason: null,
    is_auto_cancelled: false,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(15),
  },
  {
    _id: '665fmp0000000000000000m6',
    seller: '665fcccc00000000000000c2',
    buyer: null,
    payment_plan: '665fplan000000000000pl06',
    asset: '665faaaa00000000000000a2',
    unique_asset_id: 'HG-FO-003',
    asset_type: 'full-ownership',
    no_of_units: 1,
    size: 350,
    listing_price: 9_200_000,
    commission_percentage: 5,
    platform_fee: 460_000,
    referral_commission_gross: 0,
    seller_proceeds: 8_740_000,
    listing_description: 'Flagged after a buyer complaint — under review.',
    reason_for_selling: null,
    status: 'suspended',
    receipt_image: null,
    receipt_reference: null,
    receipt_amount: null,
    listed_at: daysAgo(11),
    expires_at: daysAgo(-19),
    claimed_at: null,
    sold_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    suspended_at: daysAgo(2),
    suspended_reason: 'Buyer reported the seller misrepresented the plot size.',
    is_auto_cancelled: false,
    createdAt: daysAgo(11),
    updatedAt: daysAgo(2),
  },
  {
    _id: '665fmp0000000000000000m7',
    seller: '665fcccc00000000000000c1',
    buyer: '665fcccc00000000000000c3',
    payment_plan: '665fplan000000000000pl07',
    asset: '665faaaa00000000000000a1',
    unique_asset_id: 'AVC-FL-021',
    asset_type: 'flex',
    no_of_units: 1,
    size: null,
    listing_price: 3_000_000,
    commission_percentage: 5,
    platform_fee: 150_000,
    referral_commission_gross: 0,
    seller_proceeds: 2_850_000,
    listing_description: null,
    reason_for_selling: null,
    status: 'pending_approval',
    receipt_image: 'https://res.cloudinary.com/demo/image/upload/receipt-sample-2.jpg',
    receipt_reference: 'MKT-REC-88240',
    receipt_amount: 3_000_000,
    listed_at: daysAgo(3),
    expires_at: daysAgo(-27),
    claimed_at: daysAgo(0.3),
    sold_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    suspended_at: null,
    suspended_reason: null,
    is_auto_cancelled: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(0.3),
  },
];

/** Bare ids only — mirrors `findAllPaginated`, which never populates. */
function asListRow(listing: MockListing) {
  return listing;
}

/** Mirrors `findById`: populates asset + seller, never buyer. */
function asActionResponse(listing: MockListing) {
  const seller = findPerson(listing.seller);
  const asset = MOCK_ASSETS[listing.asset];
  return {
    ...listing,
    seller: seller ? { _id: seller._id, firstName: seller.firstName, lastName: seller.lastName } : listing.seller,
    asset: asset ?? listing.asset,
  };
}

function findListing(id: string): MockListing {
  const listing = listings.find((row) => row._id === id);
  if (!listing) throw new MockHttpError(404, 'Listing not found', 'LISTING_NOT_FOUND');
  return listing;
}

function isTerminal(status: MockListingStatus): boolean {
  return status === 'sold' || status === 'cancelled' || status === 'expired';
}

export const marketplaceRoutes: MockRoutes = {
  'GET /admin/marketplace/listings': ({ query }) => {
    let rows = listings;
    const status = String(query.status ?? '');
    if (status) rows = rows.filter((row) => row.status === status);

    const sorted = [...rows].sort((a, b) => b.listed_at.localeCompare(a.listed_at));
    return paged(sorted.map(asListRow), query, 20);
  },

  'GET /admin/marketplace/pending-approvals': ({ query }) => {
    const rows = listings.filter((row) => row.status === 'pending_approval');
    const sorted = [...rows].sort((a, b) => b.listed_at.localeCompare(a.listed_at));
    return paged(sorted.map(asListRow), query, 20);
  },

  'GET /admin/marketplace/stats': () => {
    const by_status: Record<string, number> = {};
    for (const row of listings) by_status[row.status] = (by_status[row.status] ?? 0) + 1;

    const sold = listings.filter((row) => row.status === 'sold');
    return {
      by_status,
      total_sales: sold.length,
      total_sales_value: sold.reduce((sum, row) => sum + row.listing_price, 0),
      total_platform_fees: sold.reduce((sum, row) => sum + row.platform_fee, 0),
    };
  },

  'POST /admin/marketplace/listings/:id/approve': ({ params }) => {
    const listing = findListing(params.id);
    if (listing.status !== 'pending_approval') {
      throw new MockHttpError(400, 'Listing is not pending approval', 'INVALID_STATUS_TRANSITION');
    }
    listing.status = 'sold';
    listing.sold_at = new Date().toISOString();
    listing.updatedAt = listing.sold_at;
    return asActionResponse(listing);
  },

  'POST /admin/marketplace/listings/:id/reject': ({ params, body: raw }) => {
    const listing = findListing(params.id);
    if (listing.status !== 'pending_approval') {
      throw new MockHttpError(400, 'Listing is not pending approval', 'INVALID_STATUS_TRANSITION');
    }
    const dto = body<{ reason: string }>(raw);
    if (!dto.reason?.trim()) throw new MockHttpError(400, 'reason is required', 'VALIDATION_FAILED');

    listing.status = 'active';
    listing.buyer = null;
    listing.claimed_at = null;
    listing.receipt_image = null;
    listing.receipt_reference = null;
    listing.receipt_amount = null;
    listing.updatedAt = new Date().toISOString();
    return asActionResponse(listing);
  },

  'POST /admin/marketplace/listings/:id/suspend': ({ params, body: raw }) => {
    const listing = findListing(params.id);
    if (isTerminal(listing.status) || listing.status === 'suspended') {
      throw new MockHttpError(400, 'Listing cannot be suspended from its current status', 'INVALID_STATUS_TRANSITION');
    }
    const dto = body<{ reason: string }>(raw);
    if (!dto.reason?.trim()) throw new MockHttpError(400, 'reason is required', 'VALIDATION_FAILED');

    listing.status = 'suspended';
    listing.suspended_at = new Date().toISOString();
    listing.suspended_reason = dto.reason;
    listing.updatedAt = listing.suspended_at;
    return asActionResponse(listing);
  },

  'POST /admin/marketplace/listings/:id/unsuspend': ({ params }) => {
    const listing = findListing(params.id);
    if (listing.status !== 'suspended') {
      throw new MockHttpError(400, 'Listing is not suspended', 'INVALID_STATUS_TRANSITION');
    }
    listing.status = 'active';
    listing.suspended_at = null;
    listing.suspended_reason = null;
    listing.buyer = null;
    listing.claimed_at = null;
    listing.receipt_image = null;
    listing.receipt_reference = null;
    listing.receipt_amount = null;
    listing.updatedAt = new Date().toISOString();
    return asActionResponse(listing);
  },
};

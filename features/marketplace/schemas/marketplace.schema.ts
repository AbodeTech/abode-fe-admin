import { z } from 'zod';

/* ============================================================
 * Marketplace — admin listings/pending-approvals/stats + the four listing
 * actions, GET/POST /admin/marketplace/*.
 *
 * Ported off the old v1 GraphQL schema (viewAllMarketplaceListings,
 * getMarketplaceDashboard, suspend/unsuspend/approve/reject mutations),
 * which 404s against the REST base — see docs/BACKEND-REQUESTS.md #27.
 *
 * Shapes are transcribed from `MarketplaceListing` (schemas/marketplace-listing
 * .schema.ts) and the service's admin methods, live-verified 2026-08-20.
 *
 * `findAllPaginated` (used by both list endpoints) does not `.populate()` —
 * seller/buyer/asset arrive as bare id strings. `findById` (used to build the
 * single-listing response after suspend/unsuspend/approve/reject) populates
 * `asset` and `seller`, but never `buyer`. So the same field is sometimes a
 * string, sometimes an object — modeled as a union, resolved by the
 * `personRefName`/`assetRefLabel` helpers below rather than assumed populated.
 * See ticket #27.
 * ============================================================ */

export const MARKETPLACE_LISTING_STATUSES = [
  'active',
  'pending_payment',
  'pending_approval',
  'sold',
  'cancelled',
  'expired',
  'suspended',
] as const;
export const MarketplaceListingStatusSchema = z.enum(MARKETPLACE_LISTING_STATUSES);
export type MarketplaceListingStatus = z.infer<typeof MarketplaceListingStatusSchema>;

export const MARKETPLACE_LISTING_STATUS_LABELS: Record<MarketplaceListingStatus, string> = {
  active: 'Active',
  pending_payment: 'Pending payment',
  pending_approval: 'Pending approval',
  sold: 'Sold',
  cancelled: 'Cancelled',
  expired: 'Expired',
  suspended: 'Suspended',
};

export const MARKETPLACE_ASSET_TYPES = ['co-ownership', 'flex', 'full-ownership', 'land-banking'] as const;
export const MarketplaceAssetTypeSchema = z.enum(MARKETPLACE_ASSET_TYPES);
export type MarketplaceAssetType = z.infer<typeof MarketplaceAssetTypeSchema>;

const PopulatedPersonSchema = z.looseObject({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});
export type PopulatedPerson = z.infer<typeof PopulatedPersonSchema>;

const PopulatedAssetRefSchema = z.looseObject({
  _id: z.string(),
  name: z.string(),
  asset_location: z.string().optional(),
});
export type PopulatedAssetRef = z.infer<typeof PopulatedAssetRefSchema>;

/** Bare id when unpopulated (list endpoints), an object when populated (findById). */
const PersonRefSchema = z.union([z.string(), PopulatedPersonSchema]);
const AssetRefSchema = z.union([z.string(), PopulatedAssetRefSchema]);

export const MarketplaceListingSchema = z.looseObject({
  _id: z.string(),
  seller: PersonRefSchema,
  buyer: PersonRefSchema.nullable(),
  payment_plan: z.string(),
  asset: AssetRefSchema,
  unique_asset_id: z.string(),
  asset_type: MarketplaceAssetTypeSchema,
  no_of_units: z.number(),
  size: z.number().nullable().optional(),
  listing_price: z.number(),
  commission_percentage: z.number(),
  platform_fee: z.number(),
  referral_commission_gross: z.number(),
  seller_proceeds: z.number(),
  listing_description: z.string().nullable().optional(),
  reason_for_selling: z.string().nullable().optional(),
  status: MarketplaceListingStatusSchema,
  receipt_image: z.string().nullable().optional(),
  receipt_reference: z.string().nullable().optional(),
  receipt_amount: z.number().nullable().optional(),
  listed_at: z.string(),
  expires_at: z.string(),
  claimed_at: z.string().nullable().optional(),
  sold_at: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
  cancellation_reason: z.string().nullable().optional(),
  suspended_at: z.string().nullable().optional(),
  suspended_reason: z.string().nullable().optional(),
  is_auto_cancelled: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MarketplaceListing = z.infer<typeof MarketplaceListingSchema>;

/** lastName firstName — the platform-wide display order. Unresolved refs show a truncated id, not a fabricated name. */
export function personRefName(ref: string | PopulatedPerson | null | undefined): string {
  if (!ref) return 'Unassigned';
  if (typeof ref === 'string') return `Unresolved (…${ref.slice(-6)})`;
  return `${ref.lastName} ${ref.firstName}`;
}

export function assetRefLabel(ref: string | PopulatedAssetRef | null | undefined): string {
  if (!ref) return 'Unknown asset';
  if (typeof ref === 'string') return `Unresolved (…${ref.slice(-6)})`;
  return ref.name;
}

/** GET /admin/marketplace/stats — aggregation shape, not the old dashboard's flat counters. */
export const MarketplaceStatsSchema = z.looseObject({
  by_status: z.record(z.string(), z.number()),
  total_sales: z.number(),
  total_sales_value: z.number(),
  total_platform_fees: z.number(),
});

export type MarketplaceStats = z.infer<typeof MarketplaceStatsSchema>;

export function totalListingsFromStats(stats: MarketplaceStats): number {
  return Object.values(stats.by_status).reduce((sum, count) => sum + count, 0);
}

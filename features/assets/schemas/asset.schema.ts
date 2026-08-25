import { z } from 'zod';

/* ============================================================
 * Assets — the v2 model.
 *
 * An asset is a **place**, and what it sells is an **offer**:
 *
 *   Asset → AssetOffer (flex | full-ownership | commercial) → Size → Plan
 *
 * `AssetOffer` is unique on (asset_id, offer_type), so one asset can sell all
 * three at once. That is why there is one assets table rather than the two v1
 * had — offer type is a property of a row, not a separate screen.
 *
 * Commercial is not a third model. The backend writes it to the
 * full-ownership collections and runs it through the full-ownership
 * validators (`usesFoModel` below) — it is a full-ownership offer with its own
 * label and its own place in the offer-type filter.
 *
 * Money is decimal naira. See docs/ASSETS-ADMIN-DESIGN.md.
 * ============================================================ */

export const OFFER_TYPES = ['flex', 'full-ownership', 'commercial'] as const;
export const OfferTypeSchema = z.enum(OFFER_TYPES);
export type OfferType = z.infer<typeof OfferTypeSchema>;

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  flex: 'Flex',
  'full-ownership': 'Full ownership',
  commercial: 'Commercial',
};

/**
 * Mirrors the backend's `usesFoModel()` in
 * `src/modules/asset/schemas/asset-offer.schema.ts`.
 *
 * Commercial sizes are stored in the full-ownership collection and validated
 * by the full-ownership rules, so everything the API documents as
 * "full-ownership only" — `document_fee`, `payment_type`, `is_promo`, tenor 0
 * — covers commercial too. Branch on this rather than on `!== 'flex'`, so a
 * fourth offer type can't silently inherit full-ownership semantics.
 */
export function usesFoModel(offerType: OfferType): boolean {
  return offerType === 'full-ownership' || offerType === 'commercial';
}

export const VISIBILITIES = ['draft', 'internal', 'public'] as const;
export const VisibilitySchema = z.enum(VISIBILITIES);
export type Visibility = z.infer<typeof VisibilitySchema>;

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  draft: 'Draft',
  internal: 'Internal',
  public: 'Public',
};

export const TOPOGRAPHIES = ['flat', 'undulating', 'waterfront', 'hilly'] as const;
export const TopographySchema = z.enum(TOPOGRAPHIES);
export type Topography = z.infer<typeof TopographySchema>;

export const PAYMENT_TYPES = ['all-inclusive', 'partially-inclusive'] as const;
export const PaymentTypeSchema = z.enum(PAYMENT_TYPES);
export type PaymentType = z.infer<typeof PaymentTypeSchema>;

/** The four document slots an asset can carry, each a URL. */
export const AssetDocumentsSchema = z.object({
  deed_of_assignment: z.string().nullable().optional(),
  survey: z.string().nullable().optional(),
  contract_of_sales: z.string().nullable().optional(),
  estate_layout: z.string().nullable().optional(),
});

export const AssetHistoryEntrySchema = z.object({
  year: z.number(),
  value: z.number(),
});

/**
 * The per-offer summary the list endpoint aggregates for each asset.
 *
 * Counts only — no prices. A price column on the list would need a second
 * request per row, so money lives on the detail page.
 */
export const OfferSummarySchema = z.object({
  offer_type: OfferTypeSchema,
  is_active: z.boolean(),
  size_count: z.number(),
  plan_count: z.number(),
});

export type OfferSummary = z.infer<typeof OfferSummarySchema>;

/**
 * One row of the assets list.
 *
 * `available_units` is a backend virtual (`sales_cap − sold_units −
 * reserved_units`) returned because the schema sets
 * `toJSON: { virtuals: true }`. It is real data, unlike the analytics panels
 * on the same page.
 */
export const AssetSchema = z.object({
  _id: z.string(),
  name: z.string(),
  asset_location: z.string().nullable().optional(),
  google_map: z.string().nullable().optional(),
  description: z.string().nullable().optional(),

  amenities: z.array(z.string()).default([]),
  landmark: z.array(z.string()).default([]),
  topography: TopographySchema.nullable().optional(),
  asset_purpose: z.string().nullable().optional(),

  hero_image: z.string().nullable().optional(),
  pictures: z.array(z.string()).default([]),
  documents: AssetDocumentsSchema.default({}),
  asset_history: z.array(AssetHistoryEntrySchema).default([]),

  sales_cap: z.number(),
  sold_units: z.number().default(0),
  reserved_units: z.number().default(0),
  available_units: z.number().nullable().optional(),

  sold: z.boolean().default(false),
  visibility: VisibilitySchema,
  deleted_at: z.string().nullable().optional(),

  offers: z.array(OfferSummarySchema).default([]),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

/**
 * `available_units` is a virtual, so fall back to computing it rather than
 * showing a blank if a response ever omits it.
 */
export function availableUnits(asset: Pick<Asset, 'sales_cap' | 'sold_units' | 'reserved_units' | 'available_units'>): number {
  if (typeof asset.available_units === 'number') return asset.available_units;
  return Math.max(0, asset.sales_cap - asset.sold_units - asset.reserved_units);
}

/** Offers that are actually on sale, in a stable order for display. */
export function activeOffers(offers: OfferSummary[]): OfferSummary[] {
  return OFFER_TYPES.flatMap((type) => offers.filter((offer) => offer.offer_type === type));
}

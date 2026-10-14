import { z } from 'zod';

/* ============================================================
 * Assets — the v2 model.
 *
 * An asset is a **place**, and what it sells is an **offer**:
 *
 *   Asset → AssetOffer (flex | full-ownership | commercial | developer-plot) → Size → Plan
 *
 * `AssetOffer` is unique on (asset_id, offer_type), so one asset can sell
 * flex, full-ownership and commercial at once. That is why there is one
 * assets table rather than the per-type screens v1 had — offer type is a
 * property of a row, not a separate screen.
 *
 * Live availability comes from the SQM inventory ledger, not an estate-wide
 * unit counter. Configured offer units are planning capacity, not stock.
 *
 * Money is decimal naira. See docs/ASSETS-ADMIN-DESIGN.md.
 * ============================================================ */

export const OFFER_TYPES = ['flex', 'full-ownership', 'commercial', 'developer-plot'] as const;
export const OfferTypeSchema = z.enum(OFFER_TYPES);
export type OfferType = z.infer<typeof OfferTypeSchema>;

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  flex: 'Flex',
  'full-ownership': 'Full ownership',
  commercial: 'Commercial',
  'developer-plot': 'Developer plot',
};

/**
 * ⚠️ NAME COLLISION: "Developer Plot" already means something else in this
 * codebase — a PaymentPlan-level commission override (see
 * features/commission/components/rates/DeveloperPlotCard.tsx and
 * use-developer-plot-config.ts: a two-founder commission split on a
 * developer-plot sale, keyed by user ids — nothing to do with land). This
 * `offer_type` is the newer, separate concept: an Asset-level saleable
 * product pool. It has no size/plan tree in Phase 1 — it exists only as a
 * Land Account product pool, never as an addable offer in the Offers tab
 * (see AssetOffers.tsx's `missingOfferTypes`). The acquisition boundary's
 * pre-existing analytics category spells it `developer_plot` (underscored —
 * see portfolio-analytics.schema.ts's `ANALYTICS_CATEGORIES`); the two
 * spellings are not yet bridged anywhere in code. Bridge them in one place
 * if/when that's needed — never ad hoc — and never conflate the two
 * "Developer Plot" concepts.
 */

/**
 * Mirrors the backend's `usesFoModel()` (`asset-offer.schema.ts`): commercial
 * offers reuse the full-ownership shape — `payment_type` required, sizes
 * carry `document_fee`, tenor 0 is a valid outright plan. Only flex and
 * developer-plot are exempt — developer-plot has no size/plan tree at all in
 * Phase 1 (see the collision note above).
 */
export function usesFoModel(offerType: OfferType): boolean {
  return offerType === 'full-ownership' || offerType === 'commercial';
}

/** The physical-land account's configuration state — see land-configuration.schema.ts. */
export const LAND_INVENTORY_STATES = ['not_configured', 'draft', 'configured'] as const;
export const LandInventoryStateSchema = z.enum(LAND_INVENTORY_STATES);
export type LandInventoryState = z.infer<typeof LandInventoryStateSchema>;

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
  /** A real 5th document slot on the backend (`AssetDocumentsDto`) — was missing here entirely, unreachable from this app until now. */
  brochure: z.string().nullable().optional(),
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

/** One row of GET /admin/assets. Live stock is fetched from the SQM ledger. */
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

  /** Physical-land planning state; not live availability. */
  total_land_sqm: z.number().nullable().default(null),
  land_inventory_state: LandInventoryStateSchema.default('not_configured'),
  sqm_inventory_active: z.boolean(),
  land_configuration_version: z.number().default(0),

  visibility: VisibilitySchema,
  deleted_at: z.string().nullable().optional(),

  offers: z.array(OfferSummarySchema).default([]),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

/** Offers that are actually on sale, in a stable order for display. */
export function activeOffers(offers: OfferSummary[]): OfferSummary[] {
  return OFFER_TYPES.flatMap((type) => offers.filter((offer) => offer.offer_type === type));
}

import { z } from 'zod';

import {
  AssetDocumentsSchema,
  AssetHistoryEntrySchema,
  OfferTypeSchema,
  PaymentTypeSchema,
  TopographySchema,
  VisibilitySchema,
} from './asset.schema';

/* ============================================================
 * GET /admin/assets/:id — the full tree.
 *
 *   { ...asset, offers: [ { ...offer, sizes: [ { ...size, plans[] } ] } ] }
 *
 * Note what has an `_id` and what doesn't:
 *
 *   Asset   ✓        addressed by :id
 *   Offer   ✓  …but addressed by :offerType in every endpoint
 *   Size    ✓        addressed by :sizeId
 *   Plan    ✗        `@Schema({ _id: false })` — a subdocument
 *
 * Plans have no identity of their own, which is why the API addresses them by
 * `:tenor` and why `UpdatePlanDto` omits `tenor_months`. Changing a tenor is
 * therefore not an edit — it is a delete and a re-create. See ticket 19.
 * ============================================================ */

export const PlanSchema = z.object({
  tenor_months: z.number(),
  land_price: z.number(),
  initial_payment: z.number(),
  monthly_installment: z.number(),
  /** Full-ownership model only — full-ownership and commercial. */
  is_promo: z.boolean().optional(),
  is_active: z.boolean().default(true),
});

export type Plan = z.infer<typeof PlanSchema>;

export const SizeSchema = z.object({
  _id: z.string(),
  offer_id: z.string().optional(),
  size_sqm: z.number(),
  units_available: z.number(),
  /** Required on full-ownership and commercial sizes; absent on flex. */
  document_fee: z.number().optional(),
  is_active: z.boolean().default(true),
  plans: z.array(PlanSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Size = z.infer<typeof SizeSchema>;

export const OfferSchema = z.object({
  _id: z.string(),
  asset_id: z.string().optional(),
  offer_type: OfferTypeSchema,
  is_active: z.boolean().default(true),
  allocation_qualification_pct: z.number(),
  /** Full-ownership model only — full-ownership and commercial. */
  payment_type: PaymentTypeSchema.optional(),
  sizes: z.array(SizeSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Offer = z.infer<typeof OfferSchema>;

/**
 * Same asset fields as the list row, but `offers` is the full nested tree
 * rather than a counts summary — so this is its own schema rather than an
 * extension of `AssetSchema`.
 */
export const AssetDetailSchema = z.object({
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

  offers: z.array(OfferSchema).default([]),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AssetDetail = z.infer<typeof AssetDetailSchema>;

/** Plans in a stable order — outright first, then ascending tenor. */
export function sortedPlans(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => a.tenor_months - b.tenor_months);
}

/**
 * The backend blocks deleting a size that has customers on it, and blocks
 * deleting a size's last plan. Both are surfaced as disabled controls with the
 * reason rather than attempted and rejected — but the active-plan count is not
 * in this payload, so only the last-plan rule can be enforced client-side.
 */
export function isLastPlan(size: Pick<Size, 'plans'>): boolean {
  return size.plans.length <= 1;
}

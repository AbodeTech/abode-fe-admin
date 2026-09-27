import { z } from 'zod';

import { OfferTypeSchema } from './asset.schema';

/* ============================================================
 * Selling charges — GET/PUT /admin/assets/:assetId/selling-charges(/history),
 * confirmed field-for-field against `SellingChargeController`/
 * `SellingChargeService`/`asset-selling-charge.schema.ts` on abode-be-v2
 * staging (PR #82). This is what replaced the old, never-wired plan-price
 * design: an asset-wide, versioned list of buyer-facing charges rather than
 * a per-plan land price. Gated `view_asset_costs`/`manage_asset_costs`.
 * ============================================================ */

export const SELLING_CHARGE_TYPES = [
  'land_price',
  'development_levy',
  'documentation_levy',
  'survey_fee',
  'other',
] as const;
export const SellingChargeTypeSchema = z.enum(SELLING_CHARGE_TYPES);
export type SellingChargeType = z.infer<typeof SellingChargeTypeSchema>;

export const SELLING_CHARGE_TYPE_LABELS: Record<SellingChargeType, string> = {
  land_price: 'Land price',
  development_levy: 'Development levy',
  documentation_levy: 'Documentation levy',
  survey_fee: 'Survey fee',
  other: 'Other',
};

export const CHARGE_BASES = ['per_sqm', 'per_unit', 'flat'] as const;
export const ChargeBasisSchema = z.enum(CHARGE_BASES);
export type ChargeBasis = z.infer<typeof ChargeBasisSchema>;

export const CHARGE_BASIS_LABELS: Record<ChargeBasis, string> = {
  per_sqm: 'Per sqm',
  per_unit: 'Per unit',
  flat: 'Flat',
};

export const SellingChargeLineSchema = z.object({
  charge_type: SellingChargeTypeSchema,
  label: z.string(),
  offer_type: OfferTypeSchema.nullable().optional(),
  size_id: z.string().nullable().optional(),
  amount: z.number(),
  basis: ChargeBasisSchema.default('per_unit'),
  note: z.string().nullable().optional(),
});

export type SellingChargeLine = z.infer<typeof SellingChargeLineSchema>;

const SellingChargesShapeSchema = z.object({
  version: z.number(),
  charges: z.array(SellingChargeLineSchema),
  effective_date: z.string(),
  reason: z.string(),
  approved_by: z.string(),
});

/**
 * GET /admin/assets/:assetId/selling-charges. A real backend bug in
 * `SellingChargeService.current()`, confirmed reading `transform.interceptor.ts`
 * alongside it: when no charges have ever been approved, the service returns
 * `{data: null, message: '...'}`, and the interceptor's own
 * `data?.data ?? data` treats that explicit inner `null` as falsy and falls
 * back to the WHOLE `{data, message}` object — so the wire response's outer
 * `data` field is that nested object, never a plain `null`, even though the
 * service's intent was clearly "no charges yet". This schema accepts both the
 * real shape and a plain `null` and normalises either to `null`; the bug
 * itself belongs on the backend team's plate, not papered over silently here.
 */
export const SellingChargesSchema = z
  .union([SellingChargesShapeSchema, z.object({ data: z.null(), message: z.string().optional() }), z.null()])
  .transform((value) => (value && 'version' in value ? value : null));

export type SellingCharges = z.infer<typeof SellingChargesSchema>;

/** GET .../selling-charges/history — always an array, oldest first. */
export const SellingChargesHistoryEntrySchema = SellingChargesShapeSchema.extend({
  is_current: z.boolean(),
  approved_at: z.string().nullable(),
});

export type SellingChargesHistoryEntry = z.infer<typeof SellingChargesHistoryEntrySchema>;

/**
 * PUT's own response shape — narrower than `current()`'s: no `reason` or
 * `approved_by` echoed back (confirmed from `setCharges()`'s return). Refetch
 * `current()` after saving rather than trying to read those two fields off
 * the mutation result.
 */
export const SetSellingChargesResultSchema = SellingChargesShapeSchema.pick({
  version: true,
  charges: true,
  effective_date: true,
});

export type SetSellingChargesResult = z.infer<typeof SetSellingChargesResultSchema>;

/* -------------------- editor form -------------------- */

export const sellingChargeLineFormSchema = z.object({
  charge_type: SellingChargeTypeSchema.default('other'),
  label: z.string().trim().min(1, 'Give this charge a name').max(120),
  offer_type: OfferTypeSchema.optional(),
  size_id: z.string().optional(),
  amount: z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative'),
  basis: ChargeBasisSchema.default('per_unit'),
  note: z.string().trim().max(300).optional(),
});

export type SellingChargeLineFormValues = z.infer<typeof sellingChargeLineFormSchema>;

/**
 * PUT /admin/assets/:assetId/selling-charges — a complete replacement,
 * approved as a new version from `effective_date`. No `expected_version`
 * field: the real PUT has no optimistic-concurrency guard at all (last write
 * always wins) — see this schema's own note wherever it's edited, and the
 * gap this leaves has been flagged to the backend team rather than invented
 * client-side.
 */
export const setSellingChargesFormSchema = z.object({
  charges: z.array(sellingChargeLineFormSchema).min(1, 'Add at least one charge'),
  effective_date: z.string().min(1, 'Choose an effective date'),
  reason: z.string().trim().min(1, 'Say why this is changing').max(500),
});

export type SetSellingChargesFormValues = z.input<typeof setSellingChargesFormSchema>;
export type SetSellingChargesFormOutput = z.output<typeof setSellingChargesFormSchema>;

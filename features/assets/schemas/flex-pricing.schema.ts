import { z } from 'zod';

/* ============================================================
 * Flex 2.0 base-plan pricing — the wire shapes of
 *   GET|PUT|DELETE …/pricing(/draft), POST …/pricing/(publish|convert-legacy|preview)
 * under /admin/assets/:assetId/offers/flex/sizes/:sizeId.
 *
 * 🚧 Proposed contract (docs/FLEX-2.0-ENDPOINTS.pdf, section 3) — none of these
 * routes exist on staging yet, so everything here is served by
 * lib/mocks/routes/flex-pricing.ts until the backend ships them.
 *
 * Decisions this encodes: D01 the base tenor is the constant 36 (there is no
 * tenor field); D02 first/monthly payment are calculated and read-only; Q9
 * there is no approval reference; checkpoint months are fixed at 24 and 12, so
 * the editor sends two discounts and the wire carries them as a list.
 * ============================================================ */

export const PRICING_MODES = ['base_plan', 'tenor_list', 'unpriced'] as const;
export const PricingModeSchema = z.enum(PRICING_MODES);
export type PricingMode = z.infer<typeof PricingModeSchema>;

export const CheckpointSchema = z.object({
  months: z.number().int(),
  discount_pct: z.number(),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;

const UserRefSchema = z.object({ id: z.string(), name: z.string() });

const PaymentsSchema = z.object({
  first_payment: z.number(),
  monthly_payment: z.number(),
  final_payment: z.number(),
});

export const PricingVersionSchema = PaymentsSchema.extend({
  version: z.number().int().positive(),
  based_on_version: z.number().int().nullable().optional(),
  base_tenor_months: z.number().int().default(36),
  base_price_per_unit: z.number(),
  checkpoints: z.array(CheckpointSchema),
  method_version: z.string().optional(),
  published_by: UserRefSchema.nullable().optional(),
  published_at: z.string(),
  purchase_count: z.number().int().default(0),
  pending_transfer_count: z.number().int().default(0),
  status: z.enum(['live', 'superseded']).optional(),
});
export type PricingVersion = z.infer<typeof PricingVersionSchema>;

export const PricingDraftSchema = z.object({
  based_on_version: z.number().int().nullable(),
  /** What Publish will create. */
  next_version: z.number().int().positive(),
  base_price_per_unit: z.number(),
  checkpoints: z.array(CheckpointSchema),
  saved_by: UserRefSchema.nullable().optional(),
  saved_at: z.string(),
});
export type PricingDraft = z.infer<typeof PricingDraftSchema>;

export const SizePricingResponseSchema = z.object({
  size_id: z.string(),
  size_sqm: z.number(),
  pricing_mode: PricingModeSchema,
  limits: z.object({
    base_tenor_months: z.number().int(),
    min_tenor_months: z.number().int(),
    checkpoint_months: z.array(z.number().int()),
  }),
  live: PricingVersionSchema.nullable(),
  draft: PricingDraftSchema.nullable(),
  /** Only on a tenor-list size: the existing 36-month price, used to pre-fill a conversion. Never inferred when null. */
  legacy: z
    .object({
      tenor_36_land_price: z.number().nullable(),
      /** Why `tenor_36_land_price` is null — no active 36-month plan, or its payments don't add up. */
      tenor_36_unavailable_reason: z.string().nullable().optional(),
      active_tenors: z.array(z.number().int()),
    })
    .nullable(),
});
export type SizePricingResponse = z.infer<typeof SizePricingResponseSchema>;

/** The body shared by draft, publish, convert-legacy and preview. */
export type PricingPayload = {
  base_price_per_unit: number;
  checkpoints: Checkpoint[];
};

export type PublishPricingPayload = PricingPayload & {
  /** null for the first publish. Guards two admins publishing at once. */
  expected_live_version: number | null;
};

/** The editor holds two discounts; the wire carries the checkpoint list. */
export function toCheckpoints(discount24: number, discount12: number): Checkpoint[] {
  return [
    { months: 24, discount_pct: discount24 },
    { months: 12, discount_pct: discount12 },
  ];
}

export function discountAt(checkpoints: Checkpoint[] | undefined, months: 24 | 12): number | undefined {
  return checkpoints?.find((checkpoint) => checkpoint.months === months)?.discount_pct;
}

/** "5% @ 24 · 15% @ 12" — the Offers tab's one-line summary. */
export function checkpointSummary(checkpoints: Checkpoint[]): string {
  return [...checkpoints]
    .sort((a, b) => b.months - a.months)
    .map((checkpoint) => `${checkpoint.discount_pct}% @ ${checkpoint.months}`)
    .join(' · ');
}

/** Size-level summary carried on the asset detail tree. */
export const SizePricingSummarySchema = PaymentsSchema.extend({
  live_version: z.number().int().positive(),
  base_tenor_months: z.number().int().default(36),
  base_price_per_unit: z.number(),
  checkpoints: z.array(CheckpointSchema),
  published_at: z.string().nullable().optional(),
  published_by: UserRefSchema.nullable().optional(),
  has_draft: z.boolean().default(false),
});
export type SizePricingSummary = z.infer<typeof SizePricingSummarySchema>;


import { z } from 'zod';

/* ============================================================
 * Commission — shared enums, config, and plan audit.
 *
 * Source of truth for every commission shape. Types are derived with z.infer;
 * nothing here is hand-written.
 *
 * Design: docs/COMMISSION-ADMIN-DESIGN.md
 * Backend gaps: docs/BACKEND-REQUESTS.md
 * ============================================================ */

export const OFFER_TYPES = ['flex', 'full-ownership'] as const;
export const OfferTypeSchema = z.enum(OFFER_TYPES);
export type OfferType = z.infer<typeof OfferTypeSchema>;

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  flex: 'Flex',
  'full-ownership': 'Full ownership',
};

/**
 * Tier keys exactly as the BE stores them.
 *
 * **`'associate-pro'` is hyphenated.** The pre-migration frontend used
 * `associate_pro`, which misses the key, falls through to `default`, and
 * renders a wrong-but-plausible rate with no error. Read tiers through
 * `tierRate()` rather than indexing a table by a literal.
 */
export const COMMISSION_TIERS = ['founder', 'associate-pro', 'premium', 'default'] as const;
export const CommissionTierSchema = z.enum(COMMISSION_TIERS);
export type CommissionTier = z.infer<typeof CommissionTierSchema>;

export const COMMISSION_TIER_LABELS: Record<CommissionTier, string> = {
  founder: 'Founder',
  'associate-pro': 'Associate Pro',
  premium: 'Premium',
  default: 'Default',
};

/** Which level of the resolution chain produced a rate. */
export const OVERRIDE_SOURCES = ['asset_user', 'user', 'asset', 'default', 'agency'] as const;
export const OverrideSourceSchema = z.enum(OVERRIDE_SOURCES);
export type OverrideSource = z.infer<typeof OverrideSourceSchema>;

export const OVERRIDE_SOURCE_LABELS: Record<OverrideSource, string> = {
  asset_user: 'Asset + user override',
  user: 'User override',
  asset: 'Asset override',
  default: 'Default rate',
  agency: 'Agency rate',
};

/** The three legs a full-ownership sale can pay. Flex pays `direct` only. */
export const COMMISSION_LEGS = ['direct', 'upline', 'topline'] as const;
export const CommissionLegSchema = z.enum(COMMISSION_LEGS);
export type CommissionLeg = z.infer<typeof CommissionLegSchema>;

export const COMMISSION_LEG_LABELS: Record<CommissionLeg, string> = {
  direct: 'Direct',
  upline: 'Upline',
  topline: 'Topline',
};

/**
 * Tier → rate, as a fraction (0.15 = 15%).
 *
 * Deliberately keyed by `string`, not the tier enum: the BE serialises a
 * Mongoose Map, tables are not required to define every tier (`topline` only
 * has founder and associate-pro), and a tier added server-side should not turn
 * every config read into a SCHEMA_MISMATCH.
 */
export const TierRatesSchema = z.record(z.string(), z.number());
export type TierRates = z.infer<typeof TierRatesSchema>;

/**
 * Read one tier's rate, falling back to `default` — mirroring the BE's
 * `readTierRate`. The single place a tier key is used to index a table.
 */
export function tierRate(table: TierRates | null | undefined, tier: string): number | undefined {
  if (!table) return undefined;
  return table[tier] ?? table.default;
}

/* -------------------- config -------------------- */

/**
 * Rate fields are fractions in [0, 1] and are **never rounded** — rounding
 * 0.105 to two places is a 5% error in the rate itself.
 *
 * Money fields (`associate_pro_fee`, `high_commission_alert_threshold`) are
 * decimal naira. See the money convention in docs/BACKEND-REQUESTS.md §5.
 */
export const CommissionConfigSchema = z.object({
  _id: z.string().optional(),
  version: z.number(),

  flexCommission: z.object({
    direct: TierRatesSchema,
  }),

  fullOwnershipCommission: z.object({
    direct: TierRatesSchema,
    upline: TierRatesSchema,
    topline: TierRatesSchema,
  }),

  wht_rate: z.number(),
  marketplace_platform_fee_pct: z.number(),
  upgrade_commission_pct: z.number(),

  associate_pro_fee: z.number(),
  high_commission_alert_threshold: z.number(),

  /**
   * Populated by the BE (`firstName lastName email`) since 2026-07-28; a bare
   * ObjectId string can still appear on versions written before populate, so
   * both shapes parse.
   */
  last_modified_by: z
    .union([
      z.string(),
      z.looseObject({
        _id: z.string(),
        firstName: z.string().nullable().optional(),
        lastName: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
      }),
    ])
    .nullable()
    .optional(),

  /** Version metadata, recorded on publish since 2026-07-28 (ticket 11). */
  reason: z.string().nullable().optional(),
  changed_fields: z.array(z.string()).optional(),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** The admin who published a version, when populate resolved them. */
export function modifiedByName(config: CommissionConfig): string | null {
  const ref = config.last_modified_by;
  if (!ref || typeof ref === 'string') return null;
  const name = [ref.firstName, ref.lastName].filter(Boolean).join(' ');
  return name || ref.email || null;
}

export type CommissionConfig = z.infer<typeof CommissionConfigSchema>;

/** GET /admin/commission/config returns the active version plus recent history. */
export const CommissionConfigResponseSchema = z.object({
  active: CommissionConfigSchema,
  history: z.array(CommissionConfigSchema),
});

export type CommissionConfigResponse = z.infer<typeof CommissionConfigResponseSchema>;

/* -------------------- plan audit -------------------- */

/**
 * Shaped refs from the BE's `commission.shape.ts` — note the key is `id`,
 * **not `_id`**. The audit endpoint runs its refs through `shapeUser` /
 * `shapeAsset`, while the overrides list returns raw mongoose documents with
 * `_id`. Two conventions in one module; do not "fix" one to match the other.
 *
 * An unresolvable ref (deleted user, missing populate) arrives as `{id}`
 * alone, so every descriptive field is optional.
 */
export const ShapedUserRefSchema = z.looseObject({
  id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  userName: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  referral_status: z.string().nullable().optional(),
});

export type ShapedUserRef = z.infer<typeof ShapedUserRefSchema>;

export const ShapedAssetRefSchema = z.looseObject({
  id: z.string(),
  name: z.string().nullable().optional(),
});

export type ShapedAssetRef = z.infer<typeof ShapedAssetRefSchema>;

export function shapedUserName(ref: ShapedUserRef | null | undefined): string | null {
  if (!ref) return null;
  const name = [ref.firstName, ref.lastName].filter(Boolean).join(' ');
  return name || ref.userName || ref.email || null;
}

/**
 * GET /admin/commission/audit/:paymentPlanId — read straight off the plan's
 * frozen snapshot. Answers "why is this referrer earning this much" without
 * recomputing anything.
 *
 * One entry per recipient leg. Today only `direct` is ever written
 * (⛔ ticket 6 — upline/topline legs appear here once multi-level commission
 * is actually paid), but the shape already carries them.
 *
 * `tier_at_creation` is a plain string, not `CommissionTier`: the agency
 * branch writes the literal `'agency'`, which is not a tier.
 */
export const PlanAuditRecipientSchema = z.object({
  commission_type: z.string(),
  rate: z.number(),
  tier_at_creation: z.string().nullable(),
  override_source: OverrideSourceSchema.nullable(),
  user: ShapedUserRefSchema.nullable(),
  agency_id: z.string().nullable(),
});

export type PlanAuditRecipient = z.infer<typeof PlanAuditRecipientSchema>;

export const PlanAuditSchema = z.object({
  payment_plan_id: z.string(),
  buyer: ShapedUserRefSchema.nullable(),
  asset: ShapedAssetRefSchema.nullable(),
  commission_config_version: z.number().nullable(),
  wht_rate: z.number().nullable(),
  commission_recipients: z.array(PlanAuditRecipientSchema),
  /** False when the plan has no recipients — pays nobody, permanently. */
  commission_payable: z.boolean(),
});

export type PlanAudit = z.infer<typeof PlanAuditSchema>;

/* -------------------- preview (ticket 9b) -------------------- */

/**
 * GET /admin/commission/preview?user_id&asset_id&offer_type — the dry-run.
 * Resolves the same precedence chain a real purchase would
 * (asset_user → user → asset → default), without writing anything.
 *
 * One row per leg the offer type carries: flex is `direct` only,
 * full-ownership is all three. `applies: false` with a null rate means that
 * leg pays nobody at the referrer's current tier.
 */
export const PreviewLegSchema = z.object({
  commission_tier: z.enum(['direct', 'upline', 'topline']),
  applies: z.boolean(),
  rate: z.number().nullable(),
  override_source: OverrideSourceSchema.nullable(),
});

export type PreviewLeg = z.infer<typeof PreviewLegSchema>;

export const CommissionPreviewSchema = z.object({
  referrer_tier: z.string(),
  config_version: z.number(),
  wht_rate: z.number(),
  rates: z.array(PreviewLegSchema),
});

export type CommissionPreview = z.infer<typeof CommissionPreviewSchema>;

import { z } from 'zod';

/* ============================================================
 * Portfolio standing — /admin/standing/*
 *
 * The ladder buyers climb by holding land, measured in TOTAL SQUARE METRES
 * (size × units) across their live plans — not plot count.
 *
 * Called "tiers" in the UI because that is what the business calls them. In the
 * backend they are `checkpoints` on a `standing`: `User.tier` was already taken
 * by the account type (associate, premium, agency…) and only one of the two can
 * own the word in code. Contract: abode-be-v2 `src/modules/standing`.
 * ============================================================ */

export const StandingBenefitSchema = z.object({
  label: z.string(),
  /**
   * Benefits ship OFF. A perk visible to a buyer is a promise the business has
   * to keep, so ops writes it down and switches it on separately.
   */
  enabled: z.boolean(),
});

export type StandingBenefit = z.infer<typeof StandingBenefitSchema>;

export const StandingCheckpointSchema = z.object({
  key: z.string(),
  name: z.string(),
  min_sqm: z.number(),
  tagline: z.string().default(''),
  benefits: z.array(StandingBenefitSchema).default([]),
});

export type StandingCheckpoint = z.infer<typeof StandingCheckpointSchema>;

/** GET /admin/standing/config */
export const StandingConfigSchema = z.object({
  checkpoints: z.array(StandingCheckpointSchema),
  updated_at: z.string().nullable().optional(),
});

export type StandingConfig = z.infer<typeof StandingConfigSchema>;

/** GET /admin/standing/summary — the ladder with who stands where. */
export const StandingSummaryRowSchema = StandingCheckpointSchema.extend({
  /** Null on the top checkpoint: it has no ceiling. */
  max_sqm: z.number().nullable(),
  members: z.number(),
  total_sqm: z.number(),
});

export type StandingSummaryRow = z.infer<typeof StandingSummaryRowSchema>;

export const StandingSummarySchema = z.object({
  checkpoints: z.array(StandingSummaryRowSchema),
  total_members: z.number(),
});

export type StandingSummary = z.infer<typeof StandingSummarySchema>;

/** GET /admin/standing/members?checkpoint= */
export const StandingMemberSchema = z.object({
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  sqm: z.number(),
  plots: z.number(),
  /** Their earliest live purchase. */
  since: z.string().nullable(),
});

export type StandingMember = z.infer<typeof StandingMemberSchema>;

/** PUT /admin/standing/config — the whole ladder in one write. */
export type UpdateStandingConfigPayload = {
  checkpoints: {
    key: string;
    name: string;
    min_sqm: number;
    tagline?: string;
    benefits?: { label: string; enabled: boolean }[];
  }[];
};

/* --------------------------- display helpers --------------------------- */

export const formatSqm = (sqm: number): string => `${Math.round(sqm).toLocaleString()} sqm`;

/**
 * The span a checkpoint covers, as the table prints it. The top one is open —
 * "10,000 sqm and up" rather than a made-up ceiling.
 */
export function checkpointRangeLabel(row: {
  min_sqm: number;
  max_sqm: number | null;
}): string {
  if (row.max_sqm === null) return `${row.min_sqm.toLocaleString()} sqm and up`;
  return `${row.min_sqm.toLocaleString()} – ${row.max_sqm.toLocaleString()} sqm`;
}

/** A hectare is 10,000 sqm — the unit land is actually discussed in. */
export const hectares = (sqm: number): string => (sqm / 10_000).toFixed(2);

import { z } from 'zod';

/* ============================================================
 * Division — /admin/division/*
 *
 * The ladder ASSOCIATES climb by placing land, measured in total square metres
 * (plot size × units) across the sales they referred in one SEASON.
 *
 * The realtor-side sibling of Portfolio Standing, with three differences that
 * are the whole reason it is a separate screen:
 *
 *   - Standing counts what a buyer HOLDS; division counts what an associate
 *     PLACED (`payment_plan.referrer_user_id`).
 *   - Standing is lifetime; a division season is one calendar year and resets
 *     every 1 January. Hence the season picker — past seasons are frozen rows,
 *     not a recomputation.
 *   - Standing is derived on every read; division is written by a nightly
 *     sweep, because an email about crossing a threshold needs the crossing to
 *     have been recorded.
 *
 * Contract: abode-be-v2 `src/modules/division`.
 * ============================================================ */

export const DivisionBenefitSchema = z.object({
  label: z.string(),
  /**
   * Benefits ship OFF. A perk visible to an associate is a promise the business
   * has to keep, and a division changes nothing about commission today.
   */
  enabled: z.boolean(),
});

export type DivisionBenefit = z.infer<typeof DivisionBenefitSchema>;

export const DivisionTierSchema = z.object({
  key: z.string(),
  name: z.string(),
  min_sqm: z.number(),
  tagline: z.string().default(''),
  benefits: z.array(DivisionBenefitSchema).default([]),
});

export type DivisionTier = z.infer<typeof DivisionTierSchema>;

/** GET /admin/division/config */
export const DivisionConfigSchema = z.object({
  tiers: z.array(DivisionTierSchema),
  updated_at: z.string().nullable().optional(),
});

export type DivisionConfig = z.infer<typeof DivisionConfigSchema>;

/** GET /admin/division/summary?season_year= */
export const DivisionSummaryRowSchema = DivisionTierSchema.extend({
  /** Null on the top division: it has no ceiling. */
  max_sqm: z.number().nullable(),
  members: z.number(),
  total_sqm: z.number(),
});

export type DivisionSummaryRow = z.infer<typeof DivisionSummaryRowSchema>;

export const DivisionSummarySchema = z.object({
  season_year: z.number(),
  /**
   * The season running now. Stated by the server rather than inferred from the
   * newest populated season, which is wrong every January before the first sale.
   */
  live_season_year: z.number(),
  /** Every season the picker offers — populated ones plus the live one. */
  seasons: z.array(z.number()),
  tiers: z.array(DivisionSummaryRowSchema),
  /**
   * Associates the sweep has seen who have not placed a qualifying sale this
   * season. Counted apart from Bronze rather than folded into it, because they
   * have not earned a division.
   */
  unranked: z.number(),
  total_members: z.number(),
});

export type DivisionSummary = z.infer<typeof DivisionSummarySchema>;

/** GET /admin/division/members?tier=&season_year= */
export const DivisionMemberSchema = z.object({
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  sqm: z.number(),
  deals: z.number(),
  tier_key: z.string().nullable(),
  /**
   * False when the associate opted out of peer tables. Returned rather than
   * filtered so an admin can see WHY someone they know sold is missing from
   * the leaderboard, instead of assuming the numbers are broken.
   */
  division_visible: z.boolean(),
});

export type DivisionMember = z.infer<typeof DivisionMemberSchema>;

/** PUT /admin/division/config — the whole ladder in one write. */
export type UpdateDivisionConfigPayload = {
  tiers: {
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
 * The span a division covers, as the table prints it. The top one is open —
 * "30,000 sqm and up" rather than a made-up ceiling.
 */
export function tierRangeLabel(row: { min_sqm: number; max_sqm: number | null }): string {
  if (row.max_sqm === null) return `${row.min_sqm.toLocaleString()} sqm and up`;
  return `${row.min_sqm.toLocaleString()} – ${row.max_sqm.toLocaleString()} sqm`;
}

/** A hectare is 10,000 sqm — the unit land is actually discussed in. */
export const hectares = (sqm: number): string => (sqm / 10_000).toFixed(2);

/** "2026 season", and "2026 season (live)" for the one still running. */
export const seasonLabel = (year: number, live: number): string =>
  year === live ? `${year} season (live)` : `${year} season`;

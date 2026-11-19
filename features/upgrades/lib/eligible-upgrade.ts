import type { EligibleUpgrade, EligibleUpgradeApiRow } from '../schemas/upgrade.schema';

/** The only tiers the BE's eligibility list accepts (`to_tier` is required). */
export const ELIGIBLE_UPGRADE_TIERS = ['associate', 'associate-pro'] as const;
export type EligibleUpgradeTier = (typeof ELIGIBLE_UPGRADE_TIERS)[number];

/**
 * The BE row is flat and carries no tier; the table works with a nested row, so
 * the tier asked for is stamped on here. A missing course title becomes a label,
 * never a blank.
 */
export function toEligibleUpgrade(row: EligibleUpgradeApiRow, toTier: EligibleUpgradeTier): EligibleUpgrade {
  return {
    user: {
      id: row.id,
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
      email: row.email ?? null,
      referral_status: row.referral_status,
    },
    to_tier: toTier,
    course: { id: row.course_id, title: row.course_title ?? 'Required course' },
    completed_at: row.completed_at,
    best_score_pct: row.best_score_pct ?? null,
    upgrade_requested: row.upgrade_requested,
  };
}

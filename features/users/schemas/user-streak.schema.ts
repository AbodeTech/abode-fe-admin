import { z } from 'zod';

import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from './user-actions.schema';

/* ============================================================
 * Streaks & Points on the user-details Summary (D22).
 *
 *   GET  /admin/users/:id/streak          — the card
 *   POST /admin/users/:id/streak/adjust   — authorised adjustment, reason required
 *
 * 🚧 Proposed contract (docs/FLEX-2.0-ENDPOINTS.pdf §3.2); not on staging yet,
 * so lib/mocks/routes/user-streaks.ts serves it. There is no mockup for this
 * card — it follows the Summary's existing cards.
 *
 * What the decisions do and don't approve: a streak adjustment with a reason
 * and an audit record (D22). They do NOT approve adjusting points directly, any
 * adjustment limit, or points changing as a side effect of a streak change — so
 * `points_balance` is read-only here and the adjust response proves it didn't move.
 * ============================================================ */

export const UserStreakSchema = z.object({
  current_streak: z.number().int(),
  best_streak: z.number().int(),
  points_balance: z.number().int(),
  current_month: z
    .object({
      /** "YYYY-MM", Africa/Lagos. */
      month: z.string(),
      qualified: z.boolean(),
      awarded_at: z.string().nullable().optional(),
    })
    .nullable(),
  /** Last prepaid month the streak is protected through; null when none. */
  covered_through: z.string().nullable(),
  /** Plans taking part in the account-wide streak. 0 means there is no streak to show. */
  streak_enabled_plans: z.number().int(),
  last_adjustment: z
    .object({
      at: z.string(),
      by: z.string(),
      reason: z.string(),
    })
    .nullable(),
});
export type UserStreak = z.infer<typeof UserStreakSchema>;

const SnapshotSchema = z.object({
  current_streak: z.number().int(),
  best_streak: z.number().int(),
  points_balance: z.number().int(),
});

export const StreakAdjustResultSchema = z.object({
  before: SnapshotSchema,
  after: SnapshotSchema,
  audit_id: z.string(),
  adjusted_at: z.string(),
  adjusted_by: z.object({ id: z.string(), name: z.string() }),
});
export type StreakAdjustResult = z.infer<typeof StreakAdjustResultSchema>;

export const streakAdjustFormSchema = z.object({
  current_streak: z
    .number({ message: 'Enter the streak this customer should have' })
    .int('Whole months only')
    .min(0, 'Cannot be negative'),
  reason: z
    .string()
    .trim()
    .min(ADMIN_REASON_MIN, `Reason must be at least ${ADMIN_REASON_MIN} characters`)
    .max(ADMIN_REASON_MAX),
});
export type StreakAdjustFormValues = z.infer<typeof streakAdjustFormSchema>;

import { z } from 'zod';

import { ADMIN_REASON_MIN } from './user-actions.schema';

/** The backend accepts 10–500 characters; the admin app keeps its usual 20-character floor. */
export const STREAK_REASON_MAX = 500;
/** A single correction is capped at ±100,000 points by the backend. */
export const POINTS_CHANGE_LIMIT = 100_000;

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
 * A streak adjustment needs a reason and writes an audit record (D22). Since the
 * 8 Oct 2026 backend decisions (#4) it may also carry an optional `points_change`
 * — positive or negative, never taking the balance below zero — recorded in the
 * points ledger. Without it, points are untouched.
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
  /** 0 when the admin left points alone. */
  points_change: z.number().int().default(0),
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
  /** Optional points correction. Empty means "leave points alone". */
  points_change: z
    .number({ message: 'Enter a whole number of points' })
    .int('Whole points only')
    .min(-POINTS_CHANGE_LIMIT, `At most ${POINTS_CHANGE_LIMIT.toLocaleString()} points at a time`)
    .max(POINTS_CHANGE_LIMIT, `At most ${POINTS_CHANGE_LIMIT.toLocaleString()} points at a time`)
    .optional(),
  reason: z
    .string()
    .trim()
    .min(ADMIN_REASON_MIN, `Reason must be at least ${ADMIN_REASON_MIN} characters`)
    .max(STREAK_REASON_MAX, `Reason can be at most ${STREAK_REASON_MAX} characters`),
});
export type StreakAdjustFormValues = z.infer<typeof streakAdjustFormSchema>;

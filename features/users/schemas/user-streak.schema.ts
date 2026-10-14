import { z } from 'zod';

export const STREAK_REASON_MIN = 10;
export const STREAK_REASON_MAX = 500;

// Admin streak corrections support an optional, audited points delta.

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
  points_change: z.number().int(),
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
  points_change: z.number().int('Whole points only').min(-100_000).max(100_000).optional(),
  reason: z
    .string()
    .trim()
    .min(STREAK_REASON_MIN, `Reason must be at least ${STREAK_REASON_MIN} characters`)
    .max(STREAK_REASON_MAX),
});
export type StreakAdjustFormValues = z.infer<typeof streakAdjustFormSchema>;

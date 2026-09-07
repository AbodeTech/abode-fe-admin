import { z } from 'zod';

export const CheckinSessionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  venue: z.string().nullable(),
  access_type: z.literal('physical'),
  cohort_id: z.string(),
  cohort_label: z.string(),
  stats: z
    .object({
      checked_in: z.number(),
      total: z.number(),
      remaining: z.number(),
    })
    .optional(),
});

export const CheckinStatsSchema = z.object({
  session_id: z.string(),
  checked_in: z.number(),
  total: z.number(),
  remaining: z.number(),
});

export const CheckinSearchRowSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  checked_in: z.boolean(),
  checked_in_at: z.string().nullable(),
  registration_status: z.string(),
  is_abode_associate: z.string(),
});

export const CheckinResultSchema = z.object({
  outcome: z.enum(['success', 'already']),
  id: z.string(),
  name: z.string(),
  first_name: z.string(),
  is_abode_associate: z.string(),
  registration_status: z.string(),
  checked_in_at: z.string().nullable(),
});

export type CheckinSession = z.infer<typeof CheckinSessionSchema>;
export type CheckinStats = z.infer<typeof CheckinStatsSchema>;
export type CheckinSearchRow = z.infer<typeof CheckinSearchRowSchema>;
export type CheckinResult = z.infer<typeof CheckinResultSchema>;

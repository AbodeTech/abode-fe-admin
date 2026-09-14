import { z } from 'zod';

/**
 * Recruitment programmes + cohorts — Admin FE contracts.
 * Verified field-for-field against `abode-be-v2` staging
 * (`feature/academy-admin-module`, `src/modules/academy/*`) 2026-09-09/10.
 *
 * DC-01: a programme has a name and nothing else branches on it — no `type`.
 * DC-02: a cohort's physical day is a session, not a cohort field. Creating a
 * cohort builds its sessions from a `schedule` in one atomic call.
 */

export const SCHEDULE_FREQUENCIES = ['daily', 'weekdays', 'weekly'] as const;
export const ScheduleFrequencySchema = z.enum(SCHEDULE_FREQUENCIES);
export type ScheduleFrequency = z.infer<typeof ScheduleFrequencySchema>;

export const SCHEDULE_FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
};

export const ScheduleOnlineInputSchema = z.object({
  days: z.coerce.number().int().min(1).max(60),
  starts_at: z.string().min(1),
  duration_minutes: z.coerce.number().int().positive().optional(),
  verification_lead_minutes: z.coerce.number().int().min(0).optional(),
  meet_url: z.string().optional(),
  frequency: ScheduleFrequencySchema.optional(),
});
export type ScheduleOnlineInput = z.infer<typeof ScheduleOnlineInputSchema>;

export const SchedulePhysicalInputSchema = z.object({
  date: z.string().min(1),
  venue: z.string().min(1),
  city: z.string().min(1),
  details_confirmed: z.boolean().optional().default(false),
});
export type SchedulePhysicalInput = z.infer<typeof SchedulePhysicalInputSchema>;

export const ScheduleInputSchema = z.object({
  online: ScheduleOnlineInputSchema.optional(),
  physical: SchedulePhysicalInputSchema.optional(),
});
export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

/** No `is_active` here — that kill switch lives only on Programme (§2.2). */
export const CohortSummarySchema = z.object({
  id: z.string(),
  programme_id: z.string(),
  name: z.string(),
  slug: z.string(),
  label: z.string(),
  registration_goal: z.number(),
  is_default: z.boolean().optional().default(false),
  registration_open: z.boolean().optional().default(true),
  registration_opens: z.string().nullable().optional(),
  registration_closes: z.string().nullable().optional(),
  registrant_count: z.number().optional().default(0),
  session_count: z.number().optional().default(0),
  register_url: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type CohortSummary = z.infer<typeof CohortSummarySchema>;

export const ProgrammeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  cohort_count: z.number().optional().default(0),
  open_cohort_count: z.number().optional().default(0),
  default_cohort: CohortSummarySchema.nullable().optional(),
  cohorts: z.array(CohortSummarySchema).optional(),
  register_url: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Programme = z.infer<typeof ProgrammeSchema>;

/**
 * `POST /admin/academy/programmes/:id/cohorts` (and the `cohort` half of
 * `POST /admin/academy/programmes`) body. Real BE's `CreateCohortInput` has no
 * `registration_open` — a cohort always starts closed; open it afterward via
 * `POST /cohorts/:id/toggle-registration`. `schedule` is real (builds the
 * cohort's sessions in the same call) — verified against `CohortScheduleDto`.
 */
export const CreateCohortInputSchema = z.object({
  name: z.string().min(1, 'Cohort name is required'),
  label: z.string().min(1).optional(),
  registration_goal: z.coerce.number().int().positive().optional(),
  registration_opens: z.string().optional(),
  registration_closes: z.string().optional(),
  set_as_default: z.boolean().optional(),
  schedule: ScheduleInputSchema.optional(),
});
export type CreateCohortInput = z.infer<typeof CreateCohortInputSchema>;

/**
 * `PATCH /admin/academy/cohorts/:id` body — core cohort facts only. Real BE
 * splits `registration_open` and `is_default` into their own endpoints
 * (`toggle-registration`, `set-default`), each an atomic, purpose-built write —
 * neither belongs in this DTO.
 */
export const UpdateCohortInputSchema = z.object({
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  registration_goal: z.coerce.number().int().positive().optional(),
  registration_opens: z.string().nullable().optional(),
  registration_closes: z.string().nullable().optional(),
});
export type UpdateCohortInput = z.infer<typeof UpdateCohortInputSchema>;

export const UpdateProgrammeInputSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});
export type UpdateProgrammeInput = z.infer<typeof UpdateProgrammeInputSchema>;

export const CreateProgrammeInputSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  cohort: CreateCohortInputSchema,
});
export type CreateProgrammeInput = z.infer<typeof CreateProgrammeInputSchema>;

export const BreakdownItemSchema = z.object({
  name: z.string(),
  value: z.number(),
});
export type BreakdownItem = z.infer<typeof BreakdownItemSchema>;

/**
 * DC-07 outcomes — verified against `AcademyDashboardService.computeOutcomes`.
 * `acquired` = people this cohort's registration created (`was_existing: false`),
 * grouped by CURRENT tier. `influenced` = already-here registrants
 * (`was_existing: true`); never summed with acquired.
 */
export const OutcomesSchema = z.object({
  as_of: z.string(),
  acquired: z.object({
    total: z.number(),
    still_guest: z.number(),
    user: z.number(),
    associate: z.number(),
    associate_pro: z.number(),
  }),
  influenced: z.object({
    total: z.number(),
    became_pro_after: z.number(),
  }),
  median_days_to_pro: z.number().nullable(),
});
export type Outcomes = z.infer<typeof OutcomesSchema>;

/** Physical-session check-in. `null` until a cohort has a physical session (Phase 2). */
export const CheckedInStatsSchema = z.object({
  count: z.number(),
  rate: z.number(),
});
export type CheckedInStats = z.infer<typeof CheckedInStatsSchema>;

export const RegistrantSchema = z.object({
  id: z.string(),
  cohort_id: z.string(),
  user_id: z.string().optional(),
  was_existing: z.boolean().optional(),
  tier_at_registration: z.string().nullable().optional(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  age_bracket: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  employment_status: z.string().nullable().optional(),
  organisation: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  previous_attendee: z.string().nullable().optional(),
  referral_source: z.string().nullable().optional(),
  referred_by_username: z.string().nullable().optional(),
  source_meeting_id: z.string().nullable().optional(),
  checked_in: z.boolean().optional().default(false),
  checked_in_at: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type Registrant = z.infer<typeof RegistrantSchema>;

/** `PATCH /cohorts/:id/registrants/:registrantId` — allowlisted fields only, never email/identity. */
export const UpdateRegistrantInputSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  gender: z.string().optional(),
  age_bracket: z.string().optional(),
  status: z.string().optional(),
  employment_status: z.string().optional(),
  organisation: z.string().optional(),
  region: z.string().optional(),
  previous_attendee: z.string().optional(),
  referral_source: z.string().optional(),
  referred_by_username: z.string().optional(),
  checked_in: z.boolean().optional(),
});
export type UpdateRegistrantInput = z.infer<typeof UpdateRegistrantInputSchema>;

export const CohortDashboardSchema = z.object({
  /** Minimal on the dashboard payload — call `useCohort` for the full record. */
  cohort: z.object({
    id: z.string(),
    label: z.string(),
    registration_goal: z.number(),
  }),
  totalAll: z.number(),
  statesCoveredAll: z.number(),
  current: z.object({
    count: z.number(),
    new_count: z.number(),
    returning_count: z.number(),
    returning_by_tier: z.array(BreakdownItemSchema),
    dailyRegistrations: z.array(z.object({ date: z.string(), count: z.number() })),
    avgPerDay: z.number(),
    statesCovered: z.number(),
    referralBreakdown: z.array(BreakdownItemSchema),
    genderBreakdown: z.array(BreakdownItemSchema),
    ageBreakdown: z.array(BreakdownItemSchema),
    statusBreakdown: z.array(BreakdownItemSchema),
    regionBreakdown: z.array(BreakdownItemSchema),
    attendedPreviousBreakdown: z.array(BreakdownItemSchema),
  }),
  previous: z.object({
    count: z.number(),
    dailyRegistrations: z.array(z.object({ date: z.string(), count: z.number() })),
  }),
  rangeDays: z.number(),
  comparison: z.object({
    delta: z.number(),
    pctChange: z.number(),
  }),
  /** `null` until the cohort has a physical session (Phase 2). */
  checked_in: CheckedInStatsSchema.nullable(),
  recent_registrants: z.array(RegistrantSchema).optional().default([]),
  outcomes: OutcomesSchema,
});
export type CohortDashboard = z.infer<typeof CohortDashboardSchema>;

export const ReferralRowSchema = z.object({
  username: z.string(),
  user_id: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  total_referred: z.number(),
  new_count: z.number().optional().default(0),
  returning_count: z.number().optional().default(0),
  /** 0 until the meetings extension's attendance flow is wired up on this row. */
  attendance_count: z.number().optional().default(0),
  session_total: z.number().optional().default(0),
  checked_in_count: z.number().optional().default(0),
});
export type ReferralRow = z.infer<typeof ReferralRowSchema>;

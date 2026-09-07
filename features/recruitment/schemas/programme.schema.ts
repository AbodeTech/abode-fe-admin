import { z } from 'zod';

/**
 * Recruitment programmes + cohorts — Admin FE contracts for ABO-11…15.
 * Paths target provisional `/api/v1/admin/academy/*` (BE ABO-33+).
 * Permissions: view_academy | manage_academy | export_academy
 */

export const PROGRAMME_TYPES = ['rcp', 'academy', 'masterclass', 'webinar', 'custom'] as const;
export type ProgrammeType = (typeof PROGRAMME_TYPES)[number];

export const PROGRAMME_TYPE_LABELS: Record<ProgrammeType, string> = {
  rcp: 'Realtor Certification',
  academy: 'Abode Academy',
  masterclass: 'Masterclass',
  webinar: 'Webinar',
  custom: 'Custom',
};

export const CohortSummarySchema = z.object({
  id: z.string(),
  programme_id: z.string(),
  name: z.string(),
  slug: z.string(),
  label: z.string(),
  registration_goal: z.number(),
  is_active: z.boolean(),
  is_default: z.boolean().optional().default(false),
  registration_open: z.boolean().optional().default(true),
  event_date: z.string().nullable().optional(),
  event_venue: z.string().nullable().optional(),
  event_city: z.string().nullable().optional(),
  date_confirmed: z.boolean().optional().default(false),
  registrant_count: z.number().optional().default(0),
  register_url: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type CohortSummary = z.infer<typeof CohortSummarySchema>;

export const ProgrammeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(PROGRAMME_TYPES),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  cohort_count: z.number().optional().default(0),
  latest_cohort: CohortSummarySchema.nullable().optional(),
  cohorts: z.array(CohortSummarySchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Programme = z.infer<typeof ProgrammeSchema>;

export const CreateCohortInputSchema = z.object({
  name: z.string().min(1),
  registration_goal: z.coerce.number().int().positive().optional(),
  event_date: z.string().optional(),
  event_venue: z.string().optional(),
  event_city: z.string().optional(),
  date_confirmed: z.boolean().optional(),
  set_as_default: z.boolean().optional(),
  registration_open: z.boolean().optional(),
});
export type CreateCohortInput = z.infer<typeof CreateCohortInputSchema>;

export const CreateProgrammeInputSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.enum(PROGRAMME_TYPES),
  description: z.string().optional(),
  cohort: z.object({
    name: z.string().min(1, 'Cohort name is required'),
    registration_goal: z.coerce.number().int().positive().optional(),
    event_date: z.string().optional(),
    event_venue: z.string().optional(),
    event_city: z.string().optional(),
    date_confirmed: z.boolean().optional(),
    set_as_default: z.boolean().optional(),
  }),
});
export type CreateProgrammeInput = z.infer<typeof CreateProgrammeInputSchema>;

export const BreakdownItemSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const CohortDashboardSchema = z.object({
  cohort: CohortSummarySchema,
  totalAll: z.number(),
  statesCoveredAll: z.number(),
  current: z.object({
    count: z.number(),
    dailyRegistrations: z.array(z.object({ date: z.string(), count: z.number() })),
    avgPerDay: z.number(),
    statesCovered: z.number(),
    referralBreakdown: z.array(BreakdownItemSchema),
    genderBreakdown: z.array(BreakdownItemSchema),
    ageBreakdown: z.array(BreakdownItemSchema),
    statusBreakdown: z.array(BreakdownItemSchema),
    regionBreakdown: z.array(BreakdownItemSchema),
    attendedPreviousBreakdown: z.array(BreakdownItemSchema),
    associateProBreakdown: z.array(BreakdownItemSchema),
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
  recent_registrants: z.array(z.record(z.string(), z.unknown())).optional().default([]),
});
export type CohortDashboard = z.infer<typeof CohortDashboardSchema>;

export const RegistrantSchema = z.object({
  id: z.string(),
  cohort_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  age_bracket: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  is_abode_associate: z.string().nullable().optional(),
  previous_attendee: z.string().nullable().optional(),
  referral_source: z.string().nullable().optional(),
  referred_by_username: z.string().nullable().optional(),
  checked_in: z.boolean().optional().default(false),
  checked_in_at: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type Registrant = z.infer<typeof RegistrantSchema>;

export const ReferralRowSchema = z.object({
  username: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  total_referred: z.number(),
  checked_in_count: z.number().optional().default(0),
  attendance_count: z.number().optional().default(0),
});
export type ReferralRow = z.infer<typeof ReferralRowSchema>;

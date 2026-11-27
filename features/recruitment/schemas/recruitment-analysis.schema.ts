import { z } from 'zod';

export const RecruitmentStageSchema = z.enum([
  'registrant',
  'attendee',
  'test_participant',
  'test_pass',
  'course_completion',
  'approved_upgrade',
  'active_associate_pro',
]);
export type RecruitmentStage = z.infer<typeof RecruitmentStageSchema>;

export const RecruitmentFollowUpSchema = z.enum([
  'registered_without_attendance',
  'attended_without_test_attempt',
  'passed_without_course_completion',
  'completed_without_approved_upgrade',
  'attempted_without_test_pass',
  'passed_without_approved_upgrade',
  'approved_without_confirmed_sale',
]);
export type RecruitmentFollowUp = z.infer<typeof RecruitmentFollowUpSchema>;

export const RecruitmentStageMetricSchema = z.object({
  count: z.number().nullable(),
  acquired: z.number().nullable(),
  influenced: z.number().nullable(),
  unclassified: z.number().nullable(),
});
export type RecruitmentStageMetric = z.infer<typeof RecruitmentStageMetricSchema>;

const CoverageSchema = z.object({
  tracked_segments: z.number(),
  missing_segments: z.number(),
});

const StageCoverageSchema = z.object({
  tracked_cohorts: z.number(),
  missing_cohorts: z.number(),
});

const ComparisonMetricSchema = z.object({
  registrants: z.number(),
  approved_upgrades: z.number(),
  active_associate_pros: z.number(),
});

const IdComparisonSchema = ComparisonMetricSchema.extend({
  id: z.string().nullable(),
  name: z.string(),
});

const SourceComparisonSchema = ComparisonMetricSchema.extend({
  value: z.string(),
  name: z.string(),
});

const CohortMetricSchema = RecruitmentStageMetricSchema;

export const RecruitmentAnalysisSchema = z.object({
  generated_at: z.string(),
  filters: z.object({
    cohort_started_from: z.string().nullable(),
    cohort_started_to: z.string().nullable(),
    programme_id: z.string().nullable(),
    cohort_id: z.string().nullable(),
    source: z.string().nullable(),
  }),
  filter_options: z.object({
    programmes: z.array(z.object({ id: z.string(), name: z.string() })),
    cohorts: z.array(z.object({
      id: z.string(),
      programme_id: z.string(),
      name: z.string(),
      created_at: z.string(),
    })),
    sources: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
  summary: z.object({
    registrants: RecruitmentStageMetricSchema,
    attendees: RecruitmentStageMetricSchema,
    test_participants: RecruitmentStageMetricSchema,
    test_passes: RecruitmentStageMetricSchema,
    course_completions: RecruitmentStageMetricSchema,
    approved_upgrades: RecruitmentStageMetricSchema,
    active_associate_pros: RecruitmentStageMetricSchema.extend({
      confirmed_sale_only: z.number(),
      approved_recruit_only: z.number(),
      both: z.number(),
    }),
  }),
  coverage: z.object({
    registrants: CoverageSchema,
    attendees: CoverageSchema,
    test_participants: CoverageSchema,
    test_passes: CoverageSchema,
    course_completions: CoverageSchema,
    approved_upgrades: CoverageSchema,
    active_associate_pros: CoverageSchema,
  }),
  journey: z.array(z.object({
    stage: RecruitmentStageSchema,
    label: z.string(),
    count: z.number().nullable(),
    denominator_stage: RecruitmentStageSchema.nullable(),
    denominator_count: z.number().nullable(),
    conversion_rate: z.number().nullable(),
    tracked_cohorts: z.number(),
    missing_cohorts: z.number(),
  })),
  comparison: z.object({
    programmes: z.array(IdComparisonSchema),
    events: z.array(IdComparisonSchema),
    sources: z.array(SourceComparisonSchema),
    cohorts: z.array(IdComparisonSchema),
  }),
  cohorts: z.array(z.object({
    id: z.string(),
    programme_id: z.string(),
    programme_name: z.string(),
    name: z.string(),
    event_id: z.string().nullable(),
    event_name: z.string().nullable(),
    created_at: z.string(),
    status: z.enum(['registration_open', 'registration_closed']),
    stage_label: z.string().nullable(),
    registration_goal: z.number(),
    registrants: CohortMetricSchema,
    approved_upgrades: CohortMetricSchema,
    active_associate_pros: z.object({
      count: z.number().nullable(),
      confirmed_sale_only: z.number(),
      approved_recruit_only: z.number(),
      both: z.number(),
    }),
    missing_stages: z.array(z.string()),
  })),
  follow_up: z.object({
    registered_without_attendance: z.object({ count: z.number().nullable(), available: z.boolean() }),
    attended_without_test_attempt: z.object({ count: z.number().nullable(), available: z.boolean() }),
    passed_without_course_completion: z.object({ count: z.number().nullable(), available: z.boolean() }),
    completed_without_approved_upgrade: z.object({ count: z.number().nullable(), available: z.boolean() }),
    attempted_without_test_pass: z.object({ count: z.number().nullable(), available: z.boolean() }).optional(),
    passed_without_approved_upgrade: z.object({ count: z.number().nullable(), available: z.boolean() }).optional(),
    approved_without_confirmed_sale: z.object({ count: z.number().nullable(), available: z.boolean() }).optional(),
  }),
});
export type RecruitmentAnalysis = z.infer<typeof RecruitmentAnalysisSchema>;

export const RecruitmentAnalysisPersonSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone_number: z.string().nullable().optional(),
  cohort_id: z.string(),
  cohort_name: z.string(),
  programme_id: z.string(),
  programme_name: z.string(),
  event_id: z.string().nullable(),
  event_name: z.string().nullable(),
  source: z.string().nullable(),
  classification: z.enum(['acquired', 'influenced', 'unclassified']),
  furthest_stage: RecruitmentStageSchema,
  stalled_days: z.number().nullable(),
  follow_up_stage: RecruitmentFollowUpSchema.nullable(),
});
export type RecruitmentAnalysisPerson = z.infer<typeof RecruitmentAnalysisPersonSchema>;

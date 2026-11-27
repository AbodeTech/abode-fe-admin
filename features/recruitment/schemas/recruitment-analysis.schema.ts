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

export const AnalysisMoneySchema = z.object({ amount_minor: z.number(), currency: z.literal('NGN') });
export const AnalysisCostSchema = z.discriminatedUnion('availability', [
  z.object({
    availability: z.literal('tracked'),
    total: AnalysisMoneySchema,
    by_category: z.record(z.string(), AnalysisMoneySchema),
    return_on_contract_value: z.number().nullable(),
    return_on_revenue: z.number().nullable(),
    cost_per_registrant: AnalysisMoneySchema.nullable(),
    cost_per_pro: AnalysisMoneySchema.nullable(),
    cost_per_selling_pro: AnalysisMoneySchema.nullable(),
  }),
  z.object({ availability: z.literal('restricted'), reason: z.string() }),
  z.object({ availability: z.literal('unavailable'), reason: z.string() }),
]);
export const AnalysisPerformanceSchema = z.object({
  credited_pros: z.number(), selling_pros: z.number(), plans_sold: z.number(), ended_plans: z.number(),
  contract_value: AnalysisMoneySchema, revenue: AnalysisMoneySchema,
  contract_value_per_selling_pro: AnalysisMoneySchema.nullable(),
  revenue_per_selling_pro: AnalysisMoneySchema.nullable(),
  median_days_to_first_sale: z.number().nullable().optional(),
  approved_recruits: z.number(),
  definition: z.object({ version: z.string(), credit: z.string(), sales: z.string(), contract_value: z.string(), revenue: z.string(), window: z.string() }),
  cost: AnalysisCostSchema,
});
const FirstSalePointSchema = z.object({ day: z.number(), eligible: z.number(), sellers: z.number(), percent: z.number() });
const ActivityBaseSchema = z.object({ key: z.string(), label: z.string(), data_source: z.string() });
const ActivitySchema = z.discriminatedUnion('availability', [
  ActivityBaseSchema.extend({
    availability: z.literal('tracked'), tracked_from: z.string().nullable(), window: z.string(),
    eligible_pros: z.number(), participants: z.number(), nonparticipants: z.number(), unknown: z.number(),
    sellers_among_participants: z.number(), sellers_among_nonparticipants: z.number(),
    selling_rate_participants: z.number().nullable(), selling_rate_nonparticipants: z.number().nullable(),
    difference_points: z.number().nullable(),
  }),
  ActivityBaseSchema.extend({ availability: z.literal('unavailable'), reason: z.string() }),
]);
export const AnalysisPeopleSellingSchema = z.enum(['all', 'selling', 'not_selling']);
export type AnalysisPeopleSelling = z.infer<typeof AnalysisPeopleSellingSchema>;
export const AnalysisPeopleSortSchema = z.enum(['sales_value', 'revenue', 'approved_recruits', 'approved_at']);

export type AnalysisPeopleSort = z.infer<typeof AnalysisPeopleSortSchema>;

export const RecruitmentAnalysisSchema = z.object({
  generated_at: z.string(),
  performance: AnalysisPerformanceSchema.optional(),
  return_by_cohort: z.object({
    basis: z.string(), median_return_on_revenue: z.number().nullable(), cohorts_with_return: z.number(),
    items: z.array(z.object({ cohort_id: z.string(), name: z.string(), programme_name: z.string(), created_at: z.string(), availability: z.enum(['tracked', 'unavailable', 'restricted']), return_on_revenue: z.number().nullable(), return_on_contract_value: z.number().nullable() })),
  }).optional(),
  sales_timeline: z.object({ basis: z.string(), months: z.array(z.object({ month: z.string(), plans_sold: z.number(), contract_value: AnalysisMoneySchema, revenue: AnalysisMoneySchema })) }).optional(),
  first_sale_timeline: z.object({ basis: z.string(), eligible_pros: z.number(), points: z.array(FirstSalePointSchema) }).optional(),
  activity_analysis: z.object({ basis: z.string(), rows: z.array(ActivitySchema) }).optional(),
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
    performance: AnalysisPerformanceSchema.optional(),
    attendance: z.object({
      policy: z.string(), tracked: z.boolean(), count: z.number().nullable(),
      checkin_only: z.number(), meeting_verification_only: z.number(), both: z.number(),
      unresolved_verification_rows: z.number().nullable(), earliest_attended_at: z.string().nullable(),
    }).optional(),
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
  follow_ups: z.array(RecruitmentFollowUpSchema).optional(),
  attendance_source: z.enum(['checkin', 'meeting_verification', 'both']).nullable().optional(),
  attended_at: z.string().nullable().optional(),
  pro: z.object({
    approved_at: z.string(), credited_to_this_cohort: z.boolean(), credited_cohort_id: z.string().nullable(),
    plans_sold: z.number(), contract_value: AnalysisMoneySchema, revenue: AnalysisMoneySchema,
    first_sale_at: z.string().nullable(), days_to_first_sale: z.number().nullable(), approved_recruits: z.number(),
  }).nullable().optional(),
});
export type RecruitmentAnalysisPerson = z.infer<typeof RecruitmentAnalysisPersonSchema>;

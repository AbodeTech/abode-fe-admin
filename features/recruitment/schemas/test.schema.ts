import { z } from 'zod';

/**
 * Cohort tests — verified field-for-field against abode-be-v2 staging
 * (src/modules/academy/{dto/test.dto,academy-tests.service,schemas/cohort-test.schema}.ts,
 * PR #65, 2026-09-09). `eligibility_type` is required with no "no gate"
 * option on the real BE — every test is gated on session or series
 * attendance.
 */
export const TEST_ELIGIBILITY_TYPES = ['session', 'series_n_of_m'] as const;
export type TestEligibilityType = (typeof TEST_ELIGIBILITY_TYPES)[number];

export const TEST_ELIGIBILITY_LABELS: Record<TestEligibilityType, string> = {
  session: 'Must attend a specific session',
  series_n_of_m: 'Must attend N of M series sessions',
};

export const TestQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'true_false']),
  prompt: z.string(),
  options: z
    .array(z.object({ key: z.string(), label: z.string() }))
    .optional()
    .default([]),
  correct_answer: z.string(),
  position: z.number().optional().default(0),
});
export type TestQuestion = z.infer<typeof TestQuestionSchema>;

export const CohortTestSchema = z.object({
  id: z.string(),
  cohort_id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  eligibility_type: z.enum(TEST_ELIGIBILITY_TYPES),
  eligibility_meeting_id: z.string().nullable().optional(),
  eligibility_series_id: z.string().nullable().optional(),
  eligibility_required_count: z.number().nullable().optional(),
  eligibility_label: z.string().optional(),
  opens_at: z.string(),
  closes_at: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  pass_mark: z.number(),
  is_active: z.boolean(),
  question_count: z.number().optional().default(0),
  attempt_count: z.number().optional().default(0),
  public_url: z.string().optional(),
  questions: z.array(TestQuestionSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type CohortTest = z.infer<typeof CohortTestSchema>;

export const TestAttemptSchema = z.object({
  id: z.string(),
  test_id: z.string(),
  email: z.string(),
  user_id: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  /**
   * Null until submitted — an attempt row exists once a draft is saved
   * (`POST .../save`), before `submitted_at` is ever set.
   */
  score: z.number().nullable(),
  passed: z.boolean().nullable(),
  correct_count: z.number().nullable(),
  total_count: z.number().nullable(),
  submitted_at: z.string().nullable(),
});
export type TestAttempt = z.infer<typeof TestAttemptSchema>;

export type CreateCohortTestInput = {
  title: string;
  description?: string;
  eligibility_type: TestEligibilityType;
  eligibility_meeting_id?: string | null;
  eligibility_series_id?: string | null;
  eligibility_required_count?: number | null;
  opens_at: string;
  closes_at?: string | null;
  duration_minutes?: number | null;
  pass_mark: number;
  questions: Array<TestQuestionInput>;
};

export type TestQuestionInput = {
  type: 'multiple_choice' | 'true_false';
  prompt: string;
  options?: { key: string; label: string }[];
  correct_answer: string;
  /** Required on the real BE (`@Min(0) @IsInt()`) — 0-indexed order in the paper. */
  position: number;
};

/** `PATCH /admin/academy/tests/:id` — metadata only, questions replaced separately. */
export type UpdateCohortTestInput = Partial<{
  title: string;
  description: string;
  opens_at: string;
  closes_at: string | null;
  duration_minutes: number;
  pass_mark: number;
}>;

/** `PUT /admin/academy/tests/:id/questions` — full replace, at least one question. */
export type ReplaceQuestionsInput = {
  questions: TestQuestionInput[];
};

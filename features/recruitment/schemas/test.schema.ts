import { z } from 'zod';

/** Cohort tests — ABO-17 Admin / ABO-66–69 BE. */

export const TEST_ELIGIBILITY_TYPES = ['session', 'series_n_of_m', 'none'] as const;
export type TestEligibilityType = (typeof TEST_ELIGIBILITY_TYPES)[number];

export const TEST_ELIGIBILITY_LABELS: Record<TestEligibilityType, string> = {
  session: 'Must attend a specific session',
  series_n_of_m: 'Must attend N of M series sessions',
  none: 'No attendance gate',
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
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  score: z.number(),
  passed: z.boolean(),
  correct_count: z.number(),
  total_count: z.number(),
  submitted_at: z.string(),
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
  questions: Array<{
    type: 'multiple_choice' | 'true_false';
    prompt: string;
    options?: { key: string; label: string }[];
    correct_answer: string;
  }>;
};

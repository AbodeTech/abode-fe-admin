import { z } from 'zod';

/* ============================================================
 * Course learners — real, as of abode-be-v2 staging `7fefe13`
 * (`learner-admin.controller.ts` / `learner-report.service.ts`).
 *
 * Mirrors the row shape `LearnerReportService.buildRows()` returns for both
 * `GET /admin/courses/:id/learners` and `GET /admin/learners` — one row per
 * *enrolment*, not per associate. An associate enrolled in three courses
 * shows up as three rows. `GET /admin/learners` adds `course_title`; the
 * per-course endpoint doesn't need it.
 *
 * No credential fields here on purpose — the BE row carries none (no
 * `credential_id`, `state`, `earned_at`/`expires_at`/`revoked_at`, and no
 * "last active" timestamp either). See docs/COURSE-LEARNERS-BACKEND-GAPS.md.
 * ============================================================ */

export const LearnerRefSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  /** `User.referral_status` — see features/upgrades/schemas/upgrade.schema.ts's `UserTier`. */
  tier: z.string().nullable(),
});
export type LearnerRef = z.infer<typeof LearnerRefSchema>;

export const CourseProgressSchema = z.object({
  completed_modules: z.number(),
  total_modules: z.number(),
  percent: z.number(),
  complete: z.boolean(),
});
export type CourseProgress = z.infer<typeof CourseProgressSchema>;

export const LearnerQuizAttemptsSchema = z.object({
  total: z.number(),
  failed: z.number(),
  passed: z.boolean(),
  best_score_pct: z.number().nullable(),
});
export type LearnerQuizAttempts = z.infer<typeof LearnerQuizAttemptsSchema>;

export const EnrolmentRowSchema = z.object({
  enrolment_id: z.string(),
  course_id: z.string(),
  learner: LearnerRefSchema,
  started_at: z.string(),
  completed_at: z.string().nullable(),
  last_block_id: z.string().nullable(),
  progress: CourseProgressSchema,
  attempts: LearnerQuizAttemptsSchema,
});
export type EnrolmentRow = z.infer<typeof EnrolmentRowSchema>;

/** `GET /admin/learners` — the same row, plus which course it's for. */
export const GlobalEnrolmentRowSchema = EnrolmentRowSchema.extend({
  course_title: z.string().nullable(),
});
export type GlobalEnrolmentRow = z.infer<typeof GlobalEnrolmentRowSchema>;

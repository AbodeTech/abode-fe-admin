import { z } from 'zod';

/* ============================================================
 * Course — the Academy domain.
 *
 * ✅ real — backed by /admin/courses on abode-be-v2 (see
 * docs/REST-ENDPOINT-MAP.md, Academy / Courses section).
 *
 * Mirrors `CourseAdminService.shapeCourse()` exactly (staging `7fefe13`,
 * confirmed against source in Abode-Combine/Abode-Backend/abode-be-v2).
 * There is no `estate_id`/`estate_name` link, no `require_in_order`, no
 * `credential_renewal`, and no `is_first_sale_path`, `modules_count`,
 * `learners_count` or `completed_count` roll-up anywhere in this response —
 * an earlier version of this schema assumed all of these from the original
 * design mockup before the backend contract was verified against source.
 * `is_first_sale_path` has to be derived by the caller by comparing this
 * course's `id` against `academy-settings.schema.ts`'s
 * `first_sale_path_course_id`. Per-course module/learner counts aren't
 * returned by any endpoint yet — `GET /admin/courses/:id` does return the
 * course's modules (with nested blocks) inline, so `modules.length` is real
 * on the detail response; there is nothing equivalent for a list row or for
 * learner counts anywhere.
 * ============================================================ */

export const COURSE_AUDIENCES = ['realtor', 'buyer', 'both'] as const;
export const CourseAudienceSchema = z.enum(COURSE_AUDIENCES);
export type CourseAudience = z.infer<typeof CourseAudienceSchema>;

export const COURSE_AUDIENCE_LABELS: Record<CourseAudience, string> = {
  realtor: 'Realtor',
  buyer: 'Buyer',
  both: 'Realtor & buyer',
};

export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export const CourseStatusSchema = z.enum(COURSE_STATUSES);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  cover_image: z.string().nullable(),
  status: CourseStatusSchema,
  audience: CourseAudienceSchema,
  /** Plain settable field on create/update — not derived from module durations. */
  estimated_minutes: z.number(),
  credential_validity_months: z.number().nullable(),
  grants_credential: z.boolean(),
  created_by: z.string(),
  published_at: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type Course = z.infer<typeof CourseSchema>;

/** A course with its modules and each module's content blocks — only `GET /admin/courses/:id` returns this. */
export const CourseModuleRefSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  title: z.string(),
  position: z.number(),
});
export type CourseModuleRef = z.infer<typeof CourseModuleRefSchema>;

export const ContentBlockRefSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  type: z.enum(['text', 'video', 'image', 'file', 'quiz']),
  position: z.number(),
  payload: z.record(z.string(), z.unknown()),
});
export type ContentBlockRef = z.infer<typeof ContentBlockRefSchema>;

export const CourseDetailSchema = CourseSchema.extend({
  modules: z.array(CourseModuleRefSchema.extend({ blocks: z.array(ContentBlockRefSchema) })),
});
export type CourseDetail = z.infer<typeof CourseDetailSchema>;

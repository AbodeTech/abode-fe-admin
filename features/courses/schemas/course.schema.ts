import { z } from 'zod';

/* ============================================================
 * Course — the Academy domain.
 *
 * 🚧 provisional — no BE endpoint exists yet (see docs/REST-ENDPOINT-MAP.md,
 * Academy / Courses section). Mock-only until the BE ships /admin/courses.
 *
 * `is_first_sale_path` is shown here for convenience on list/detail rows, but
 * the exclusive "which course holds it" state lives on the academy_settings
 * singleton (see academy-settings.schema.ts) — this field is a read-only
 * projection of that, never written directly.
 * ============================================================ */

export const COURSE_AUDIENCES = ['realtor', 'buyer'] as const;
export const CourseAudienceSchema = z.enum(COURSE_AUDIENCES);
export type CourseAudience = z.infer<typeof CourseAudienceSchema>;

export const COURSE_AUDIENCE_LABELS: Record<CourseAudience, string> = {
  realtor: 'Realtor',
  buyer: 'Buyer',
};

export const COURSE_STATUSES = ['draft', 'published'] as const;
export const CourseStatusSchema = z.enum(COURSE_STATUSES);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Draft',
  published: 'Published',
};

export const CREDENTIAL_RENEWALS = ['refresher', 'full_retake'] as const;
export const CredentialRenewalSchema = z.enum(CREDENTIAL_RENEWALS);
export type CredentialRenewal = z.infer<typeof CredentialRenewalSchema>;

export const CREDENTIAL_RENEWAL_LABELS: Record<CredentialRenewal, string> = {
  refresher: 'Refresher module only',
  full_retake: 'Full retake',
};

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  audience: CourseAudienceSchema,
  estate_id: z.string().nullable(),
  estate_name: z.string().nullable().optional(),
  cover_url: z.string().nullable(),
  status: CourseStatusSchema,
  published_at: z.string().nullable(),
  require_in_order: z.boolean(),
  grants_credential: z.boolean(),
  credential_validity_months: z.number().nullable(),
  credential_renewal: CredentialRenewalSchema.nullable(),
  /** Read-only projection of academy_settings.first_sale_path_course_id. */
  is_first_sale_path: z.boolean(),
  modules_count: z.number(),
  learners_count: z.number(),
  completed_count: z.number(),
  /** Derived — sum of module durations. Never sent on write. */
  estimated_minutes: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Course = z.infer<typeof CourseSchema>;

export const CourseSummarySchema = z.object({
  total: z.number(),
  published: z.number(),
  draft: z.number(),
  realtor: z.number(),
  buyer: z.number(),
});
export type CourseSummary = z.infer<typeof CourseSummarySchema>;

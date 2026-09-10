import { z } from 'zod';

/* ============================================================
 * academy_settings — a singleton, not a per-course flag.
 *
 * Exactly one realtor course can be the first-sale path at a time. Modelling
 * it as a single reference here (rather than a bool on `course`) makes the
 * exclusivity structural: setting it on one course is one write that clears
 * it everywhere else, instead of a transaction that must find-and-unset a
 * previous holder.
 * ============================================================ */

export const AcademySettingsSchema = z.object({
  first_sale_path_course_id: z.string().nullable(),
  first_sale_path_course_title: z.string().nullable(),
});
export type AcademySettings = z.infer<typeof AcademySettingsSchema>;

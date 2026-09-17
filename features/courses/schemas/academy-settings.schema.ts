import { z } from 'zod';

/* ============================================================
 * academy_settings — a singleton, not a per-course flag.
 *
 * Exactly one course can hold this — setting it here takes it off whichever
 * course has it today. Modelling it as a single reference here (rather than
 * a bool on `course`) makes the exclusivity structural: setting it on one
 * course is one write that clears it everywhere else, instead of a
 * transaction that must find-and-unset a previous holder.
 *
 * `CourseAdminService.getSettings()` / `updateSettings()` (staging `7fefe13`)
 * return only the id — no title — so a caller wanting the current holder's
 * name has to look the course up separately. `PATCH /admin/academy-settings`
 * 400s (`FIRST_SALE_COURSE_NOT_PUBLISHED`) unless the target course is
 * already published.
 * ============================================================ */

export const AcademySettingsSchema = z.object({
  first_sale_path_course_id: z.string().nullable(),
});
export type AcademySettings = z.infer<typeof AcademySettingsSchema>;

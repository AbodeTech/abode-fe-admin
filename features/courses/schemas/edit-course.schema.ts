import { z } from 'zod';

import { CourseAudienceSchema, type Course } from './course.schema';

/* -------------------- details -------------------- */

export const courseDetailsFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  audience: CourseAudienceSchema,
});
export type CourseDetailsFormValues = z.infer<typeof courseDetailsFormSchema>;

export function courseToDetailsForm(course: Course): CourseDetailsFormValues {
  return {
    title: course.title,
    summary: course.summary ?? '',
    audience: course.audience,
  };
}

/* -------------------- cover -------------------- */

export const courseCoverFormSchema = z.object({
  cover_image: z.string().nullable(),
});
export type CourseCoverFormValues = z.infer<typeof courseCoverFormSchema>;

export function courseToCoverForm(course: Course): CourseCoverFormValues {
  return { cover_image: course.cover_image };
}

/* -------------------- credential -------------------- */

export const courseCredentialFormSchema = z.object({
  grants_credential: z.boolean(),
  credential_validity_months: z.number().int().positive().nullable(),
});
export type CourseCredentialFormValues = z.infer<typeof courseCredentialFormSchema>;

export function courseToCredentialForm(course: Course): CourseCredentialFormValues {
  return {
    grants_credential: course.grants_credential,
    credential_validity_months: course.credential_validity_months,
  };
}

import { z } from 'zod';

import { FieldResponsibilitySchema, FieldStaffTypeSchema } from './field-staff.schema';

/* ============================================================
 * Forms for managing field staff: invite, assign a site, end an assignment.
 * Limits mirror the backend DTOs. Dates are YYYY-MM-DD from <input type="date">.
 * ============================================================ */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');

export const InviteFormSchema = z.object({
  staff_type: FieldStaffTypeSchema,
  first_name: z.string().trim().min(1, 'First name is required').max(60, 'Keep it under 60 characters'),
  last_name: z.string().trim().min(1, 'Last name is required').max(60, 'Keep it under 60 characters'),
  email: z.email('Enter a valid email address'),
  phone_number: z.string().trim().max(32, 'Keep it under 32 characters'),
  employee_reference: z.string().trim().max(40, 'Keep it under 40 characters'),
});
export type InviteFormValues = z.infer<typeof InviteFormSchema>;

export const AssignSiteFormSchema = z.object({
  asset_id: z.string().min(1, 'Pick a site'),
  starts_on: isoDate,
  responsibility: FieldResponsibilitySchema,
  note: z.string().trim().max(300, 'Keep it under 300 characters'),
});
export type AssignSiteFormValues = z.infer<typeof AssignSiteFormSchema>;

/** `startsOn` is YYYY-MM-DD; the last day can't come before it. */
export const makeEndAssignmentFormSchema = (startsOn: string | null) =>
  z
    .object({
      ends_on: isoDate,
      reason: z.string().trim().min(1, 'A reason is required').max(300, 'Keep it under 300 characters'),
    })
    .superRefine((values, ctx) => {
      if (startsOn && values.ends_on < startsOn) {
        ctx.addIssue({ code: 'custom', path: ['ends_on'], message: 'Must be on or after the start date' });
      }
    });
export type EndAssignmentFormValues = z.infer<ReturnType<typeof makeEndAssignmentFormSchema>>;

/** Today in local time, as <input type="date"> wants it. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The date part of an ISO timestamp, or null. */
export const dateOnly = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null);

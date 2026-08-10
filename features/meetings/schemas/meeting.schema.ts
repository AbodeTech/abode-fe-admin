import { z } from "zod";
import { isValidGoogleMeetUrl } from "../lib/meet-validation";

export const audienceTypeSchema = z.enum([
  "all_associates",
  "associate_pro_plus",
  "associate_only",
]);

/**
 * Allow clearing the field while typing (undefined).
 * No .default(30) — that was re-filling the input when emptied.
 */
const verificationLeadMinutesSchema = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number" && Number.isNaN(val)) return undefined;
  return typeof val === "string" ? Number(val) : val;
}, z.number().int().min(5, "Must be at least 5 minutes").max(120, "Must be at most 120 minutes"));

export const createMeetingSchema = z.object({
  name: z.string().min(1, "Meeting name is required"),
  google_meet_url: z
    .string()
    .min(1, "Google Meet URL is required")
    .refine(isValidGoogleMeetUrl, "Enter a valid Google Meet URL (meet.google.com)"),
  starts_at: z.string().min(1, "Start date and time is required"),
  audience_type: audienceTypeSchema,
  verification_lead_minutes: verificationLeadMinutesSchema,
});

export const updateMeetingSchema = createMeetingSchema.extend({
  meeting_id: z.string().min(1),
});

export type CreateMeetingFormValues = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingFormValues = z.infer<typeof updateMeetingSchema>;

/** Form state allows empty while the user is editing the number. */
export type MeetingFormValues = Omit<
  CreateMeetingFormValues,
  "verification_lead_minutes"
> & {
  verification_lead_minutes: number | undefined;
};

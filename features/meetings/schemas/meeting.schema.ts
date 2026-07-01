import { z } from "zod";
import { isValidGoogleMeetUrl } from "../lib/meet-validation";

export const audienceTypeSchema = z.enum([
  "all_associates",
  "associate_pro_plus",
  "associate_only",
]);

export const createMeetingSchema = z.object({
  name: z.string().min(1, "Meeting name is required"),
  google_meet_url: z
    .string()
    .min(1, "Google Meet URL is required")
    .refine(isValidGoogleMeetUrl, "Enter a valid Google Meet URL (meet.google.com)"),
  starts_at: z.string().min(1, "Start date and time is required"),
  audience_type: audienceTypeSchema,
  verification_lead_minutes: z.number().int().min(5).max(120).default(30),
});

export const updateMeetingSchema = createMeetingSchema.extend({
  meeting_id: z.string().min(1),
});

export type CreateMeetingFormValues = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingFormValues = z.infer<typeof updateMeetingSchema>;

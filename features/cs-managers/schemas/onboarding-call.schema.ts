import * as z from "zod";
import { LAND_CHOICE_REASONS, ONBOARDING_CALL_OUTCOMES } from "./cs-manager.schema";

/**
 * Log-an-onboarding-call form.
 *
 * BE accepts no land_choice_reason for every outcome, but a "done" call
 * IS the intel-gathering call and marking it done is what ticks the CSM's
 * onboarded counter — so the reason is required there and optional
 * everywhere else. The reason is a pick from the BE's fixed list, which
 * rejects free text; anything off the list is "other" plus the notes.
 */
export const onboardingCallSchema = z
  .object({
    outcome: z.enum(ONBOARDING_CALL_OUTCOMES, {
      message: "Pick what happened on the call",
    }),
    landChoiceReason: z.enum(LAND_CHOICE_REASONS).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.outcome !== "done" || !!v.landChoiceReason, {
    path: ["landChoiceReason"],
    message: "Pick why the customer chose this land before marking the call done",
  });

export type OnboardingCallFormValues = z.infer<typeof onboardingCallSchema>;

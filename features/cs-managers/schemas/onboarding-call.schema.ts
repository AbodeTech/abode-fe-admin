import * as z from "zod";
import { ONBOARDING_CALL_OUTCOMES } from "./cs-manager.schema";

/**
 * Log-an-onboarding-call form.
 *
 * BE accepts a null land_choice_reason for every outcome, but a "done" call
 * IS the intel-gathering call and marking it done is what ticks the CSM's
 * onboarded counter — so the reason is required there and optional
 * everywhere else.
 */
export const onboardingCallSchema = z
  .object({
    outcome: z.enum(ONBOARDING_CALL_OUTCOMES, {
      message: "Pick what happened on the call",
    }),
    landChoiceReason: z.string().trim().max(1000).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.outcome !== "done" || (v.landChoiceReason?.length ?? 0) >= 3, {
    path: ["landChoiceReason"],
    message: "Record why the customer chose this land before marking the call done",
  });

export type OnboardingCallFormValues = z.infer<typeof onboardingCallSchema>;

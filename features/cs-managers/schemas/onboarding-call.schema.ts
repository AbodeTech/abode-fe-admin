import * as z from "zod";

/**
 * Log-an-onboarding-call form.
 *
 * BE accepts a null landChoiceReason for every outcome, but a "done" call IS
 * the intel-gathering call (guidelines/CS_Manager_Dashboard.md §3) and marking
 * it done is what ticks the CSM's onboarded counter — so the reason is required
 * there and optional everywhere else.
 */
/**
 * Why the customer bought, as a fixed list.
 *
 * Mirrors LAND_CHOICE_REASONS on the BE, which rejects anything off it. The
 * list is not invented: it is what CSMs actually typed across 556 free-text
 * answers — investment 139, location 92, campaign 43, referrer 38, price 30,
 * flexible payment 17, then the tail — in 162 different spellings, which could
 * not be counted. Counting the answers is the whole reason the question is
 * asked on the call.
 */
export const LAND_CHOICE_REASONS = [
  { value: "investment", label: "Investment" },
  { value: "location", label: "Location" },
  { value: "campaign", label: "Campaign" },
  { value: "referrer", label: "Referrer" },
  { value: "price", label: "Price" },
  { value: "flexible_payment", label: "Flexible payment" },
  { value: "payment_duration", label: "Payment duration" },
  { value: "development_in_area", label: "Development in the area" },
  { value: "other", label: "Other — say more in the notes" },
] as const;

export const ONBOARDING_CALL_OUTCOMES = [
  "done",
  "spoke",
  "no_answer",
  "rescheduled",
] as const;

export const onboardingCallSchema = z
  .object({
    outcome: z.enum(ONBOARDING_CALL_OUTCOMES, {
      message: "Pick what happened on the call",
    }),
    landChoiceReason: z
      .enum(LAND_CHOICE_REASONS.map((r) => r.value) as [string, ...string[]])
      .optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (v) => v.outcome !== "done" || !!v.landChoiceReason,
    {
      path: ["landChoiceReason"],
      message: "Pick why the customer chose this land before marking the call done",
    }
  );

export type OnboardingCallFormValues = z.infer<typeof onboardingCallSchema>;

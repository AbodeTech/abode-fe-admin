import * as z from "zod";

export const ONBOARDING_OUTCOMES = ["picked", "not_available", "rescheduled"] as const;
export type OnboardingOutcome = (typeof ONBOARDING_OUTCOMES)[number];

export const ATTEMPT_VALUES = ["1", "2", "3"] as const;
const YES_NO = ["yes", "no"] as const;
const YES_NO_MAYBE = ["yes", "no", "uncertain"] as const;

export const SUPPORT_OPTIONS = [
  { value: "materials", label: "Provision materials" },
  { value: "training", label: "Training support" },
  { value: "accountability", label: "Accountability" },
  { value: "others", label: "Others" },
] as const;
const SUPPORT_VALUES = ["materials", "training", "accountability", "others"] as const;

export const onboardingSchema = z
  .object({
    outcome: z.enum(ONBOARDING_OUTCOMES),
    // Not Available
    attempt: z.enum(ATTEMPT_VALUES).optional(),
    // Picked — all optional individually; the manager fills what's relevant
    motivation: z.string().optional(),
    experience: z.enum(YES_NO).optional(),
    experienceLength: z.string().optional(),
    prospects: z.string().optional(),
    incomeGoal: z.string().optional(),
    support: z.enum(SUPPORT_VALUES).optional(),
    supportOther: z.string().optional(),
    readDocs: z.enum(YES_NO_MAYBE).optional(),
    gotGuide: z.enum(YES_NO).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.outcome === "not_available" && !data.attempt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["attempt"],
        message: "Pick the attempt number",
      });
    }
    if (
      data.outcome === "picked" &&
      data.experience === "yes" &&
      !data.experienceLength?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["experienceLength"],
        message: "How long?",
      });
    }
    if (
      data.outcome === "picked" &&
      data.support === "others" &&
      !data.supportOther?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supportOther"],
        message: "Tell us what kind of support",
      });
    }
  });

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

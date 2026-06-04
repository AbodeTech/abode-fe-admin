import * as z from "zod";

export const ONBOARDING_OUTCOMES = ["picked", "not_available", "rescheduled"] as const;
export type OnboardingOutcome = (typeof ONBOARDING_OUTCOMES)[number];

const YES_NO = ["yes", "no"] as const;
const YES_NO_MAYBE = ["yes", "no", "uncertain"] as const;

export const SUPPORT_OPTIONS = [
  { value: "materials", label: "Provision materials" },
  { value: "training", label: "Training support" },
  { value: "accountability", label: "Accountability" },
  { value: "others", label: "Others" },
] as const;
const SUPPORT_VALUES = ["materials", "training", "accountability", "others"] as const;

export const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "anytime", label: "Anytime" },
] as const;
const TIME_OF_DAY_VALUES = ["morning", "afternoon", "evening", "anytime"] as const;

export const onboardingSchema = z
  .object({
    outcome: z.enum(ONBOARDING_OUTCOMES),
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
    // Rescheduled
    rescheduleDate: z.date().optional(),
    rescheduleTimeOfDay: z.enum(TIME_OF_DAY_VALUES).optional(),
    rescheduleNote: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.outcome === "rescheduled" && !data.rescheduleDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rescheduleDate"],
        message: "Pick the reschedule date",
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

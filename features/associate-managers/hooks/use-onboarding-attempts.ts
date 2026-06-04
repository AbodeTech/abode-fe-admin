import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { managerKeys } from "./query-keys";

const GET_ONBOARDING_ATTEMPTS_QUERY = graphql(`
  query GetOnboardingAttempts($proId: ID!) {
    getOnboardingAttempts(proId: $proId) {
      _id
      pro
      outcome
      attemptNumber
      isOverdue
      manager {
        _id
        userName
        firstName
        lastName
        email
        role
      }
      motivation
      experience
      experienceLength
      prospects
      incomeGoal
      support
      supportOther
      readDocs
      gotGuide
      rescheduleDate
      rescheduleTimeOfDay
      rescheduleNote
      createdAt
    }
  }
`);

export const useOnboardingAttempts = (proId: string | null | undefined) => {
  return useQuery({
    queryKey: managerKeys.onboardingAttempts(proId || ""),
    queryFn: () => execute(GET_ONBOARDING_ATTEMPTS_QUERY, { proId: proId as string }),
    enabled: Boolean(proId),
    select: (data) => data.getOnboardingAttempts,
  });
};

export type OnboardingAttemptData = NonNullable<
  ReturnType<typeof useOnboardingAttempts>["data"]
>[number];
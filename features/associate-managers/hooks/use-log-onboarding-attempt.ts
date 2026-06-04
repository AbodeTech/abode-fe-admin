import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { LogOnboardingAttemptInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const LOG_ONBOARDING_ATTEMPT_MUTATION = graphql(`
  mutation LogOnboardingAttempt($input: LogOnboardingAttemptInput!) {
    logOnboardingAttempt(input: $input) {
      _id
      pro
      outcome
      attemptNumber
      isOverdue
      createdAt
    }
  }
`);

export const useLogOnboardingAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LogOnboardingAttemptInput) =>
      execute(LOG_ONBOARDING_ATTEMPT_MUTATION, { input }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: managerKeys.onboardingAttempts(variables.proId),
      });
      // A Picked attempt flips User.onboardedAt + bumps onboardedInPeriod;
      // dashboard panels read both, so re-fetch all dashboards.
      queryClient.invalidateQueries({ queryKey: managerKeys.dashboards() });
    },
  });
};
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { allocationKeys } from "./query-keys";

const DEALLOCATE_LAND_MUTATION = graphql(`
  mutation DeallocateLand($paymentPlanId: ID!) {
    deallocateLand(paymentPlanId: $paymentPlanId) {
      success
      message
    }
  }
`);

export interface DeallocateLandResult {
  success: boolean;
  message: string;
}

export const useDeallocateLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (paymentPlanId: string) =>
      execute(DEALLOCATE_LAND_MUTATION, { paymentPlanId }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

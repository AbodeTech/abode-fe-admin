import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { allocationKeys } from "./query-keys";

const SEND_ALLOCATION_EMAIL_MUTATION = graphql(`
  mutation SendAllocationEmail($paymentPlanId: ID!) {
    sendAllocationEmail(paymentPlanId: $paymentPlanId) {
      success
      message
    }
  }
`);

export interface SendAllocationEmailResult {
  success: boolean;
  message: string;
}

export const useSendAllocationEmail = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (paymentPlanId: string) =>
      execute(SEND_ALLOCATION_EMAIL_MUTATION, { paymentPlanId }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

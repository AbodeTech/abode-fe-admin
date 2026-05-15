import { useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationKeys } from "./query-keys";

// NOTE: GraphQL mutation commented out until staging deploys sendAllocationEmail.
//
// const SEND_ALLOCATION_EMAIL_MUTATION = graphql(`
//   mutation SendAllocationEmail($paymentPlanId: ID!) {
//     sendAllocationEmail(paymentPlanId: $paymentPlanId) {
//       success
//       message
//     }
//   }
// `);

export interface SendAllocationEmailResult {
  success: boolean;
  message: string;
}

const NOT_DEPLOYED = new Error(
  "Block/plot allocation v2 API is not yet available on the backend"
);

export const useSendAllocationEmail = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (_paymentPlanId: string) =>
      Promise.reject<SendAllocationEmailResult>(NOT_DEPLOYED),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

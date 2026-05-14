import { useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationKeys } from "./query-keys";

// NOTE: GraphQL mutation commented out until staging deploys v2 deallocateLand.
//
// const DEALLOCATE_LAND_MUTATION = graphql(`
//   mutation DeallocateLand($paymentPlanId: ID!) {
//     deallocateLand(paymentPlanId: $paymentPlanId) {
//       success
//       message
//     }
//   }
// `);

export interface DeallocateLandResult {
  success: boolean;
  message: string;
}

const NOT_DEPLOYED = new Error(
  "Block/plot allocation v2 API is not yet available on the backend"
);

export const useDeallocateLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (_paymentPlanId: string) =>
      Promise.reject<DeallocateLandResult>(NOT_DEPLOYED),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

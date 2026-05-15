import { useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationKeys } from "./query-keys";
import type { AllocateLandResult } from "./use-allocate-land";

// NOTE: GraphQL mutation commented out until staging deploys reassignLand.
//
// const REASSIGN_LAND_MUTATION = graphql(`
//   mutation ReassignLand($paymentPlanId: ID!, $newPlotIds: [ID!]!) {
//     reassignLand(paymentPlanId: $paymentPlanId, newPlotIds: $newPlotIds) {
//       success
//       message
//       assetName
//       allocations {
//         plotId
//         block_label
//         plot_number
//         size
//       }
//       user {
//         name
//         email
//       }
//     }
//   }
// `);

export interface ReassignLandInput {
  paymentPlanId: string;
  newPlotIds: string[];
}

const NOT_DEPLOYED = new Error(
  "Block/plot allocation v2 API is not yet available on the backend"
);

export const useReassignLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (_input: ReassignLandInput) =>
      Promise.reject<AllocateLandResult>(NOT_DEPLOYED),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

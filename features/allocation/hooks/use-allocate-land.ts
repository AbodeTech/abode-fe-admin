import { useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationKeys } from "./query-keys";

// NOTE: GraphQL mutation commented out until staging deploys v2 allocateLand(plotIds[]).
//
// const ALLOCATE_LAND_MUTATION = graphql(`
//   mutation AllocateLand($paymentPlanId: ID!, $plotIds: [ID!]!) {
//     allocateLand(paymentPlanId: $paymentPlanId, plotIds: $plotIds) {
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

export interface AllocateLandInput {
  paymentPlanId: string;
  plotIds: string[];
}

export interface AllocationEntry {
  plotId: string;
  block_label: string;
  plot_number: number;
  size: number;
}

export interface AllocateLandResult {
  success: boolean;
  message: string;
  assetName: string;
  allocations: AllocationEntry[];
  user: { name: string; email: string };
}

const NOT_DEPLOYED = new Error(
  "Block/plot allocation v2 API is not yet available on the backend"
);

export const useAllocateLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (_input: AllocateLandInput) =>
      Promise.reject<AllocateLandResult>(NOT_DEPLOYED),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

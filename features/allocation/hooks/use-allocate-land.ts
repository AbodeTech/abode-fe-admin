import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { allocationKeys } from "./query-keys";

const ALLOCATE_LAND_MUTATION = graphql(`
  mutation AllocateLand($paymentPlanId: ID!, $plotIds: [ID!]!) {
    allocateLand(paymentPlanId: $paymentPlanId, plotIds: $plotIds) {
      success
      message
      assetName
      allocations {
        plotId
        block_label
        plot_number
        size
      }
      user {
        name
        email
      }
    }
  }
`);

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

export const useAllocateLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AllocateLandInput) =>
      execute(ALLOCATE_LAND_MUTATION, {
        paymentPlanId: input.paymentPlanId,
        plotIds: input.plotIds,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

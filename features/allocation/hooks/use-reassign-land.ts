import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { allocationKeys } from "./query-keys";

const REASSIGN_LAND_MUTATION = graphql(`
  mutation ReassignLand($paymentPlanId: ID!, $newPlotIds: [ID!]!) {
    reassignLand(paymentPlanId: $paymentPlanId, newPlotIds: $newPlotIds) {
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

export interface ReassignLandInput {
  paymentPlanId: string;
  newPlotIds: string[];
}

export const useReassignLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ReassignLandInput) =>
      execute(REASSIGN_LAND_MUTATION, {
        paymentPlanId: input.paymentPlanId,
        newPlotIds: input.newPlotIds,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

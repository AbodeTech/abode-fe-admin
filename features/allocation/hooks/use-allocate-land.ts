import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { allocationKeys } from './query-keys';

const ALLOCATE_LAND_MUTATION = graphql(`
  mutation AllocateLand($paymentPlanId: String!, $block: String!, $plot: String!) {
    allocateLand(paymentPlanId: $paymentPlanId, block: $block, plot: $plot) {
      success
      message
      block
      plot
      assetName
      previousAllocation {
        block
        plot
      }

    }
  }
`);

export interface AllocateLandInput {
  paymentPlanId: string;
  block: string;
  plot: string;
}

export const useAllocateLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AllocateLandInput) =>
      execute(ALLOCATE_LAND_MUTATION, {
        paymentPlanId: input.paymentPlanId,
        block: input.block,
        plot: input.plot,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

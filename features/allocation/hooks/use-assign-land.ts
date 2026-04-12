import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { allocationKeys } from './query-keys';

// TODO: swap to typed `execute()` once the assignLand mutation is added to the schema
const ASSIGN_LAND_MUTATION = `
  mutation AssignLand($paymentPlanId: String!, $block: String!, $plot: String!) {
    assignLand(paymentPlanId: $paymentPlanId, block: $block, plot: $plot) {
      success
      message
    }
  }
`;

export interface AssignLandInput {
  paymentPlanId: string;
  block: string;
  plot: string;
}

export const useAssignLand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignLandInput) =>
      executeRaw<{ assignLand: { success: boolean; message: string } }>(
        ASSIGN_LAND_MUTATION,
        { paymentPlanId: input.paymentPlanId, block: input.block, plot: input.plot }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};

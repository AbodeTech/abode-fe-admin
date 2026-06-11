import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { suspendPaymentPlan, unSuspendPaymentPlan } from '@/lib/api/admin/user-assets.client';
import { userKeys } from './query-keys';
import { getErrorMessage } from '../utils/error-message';

export type PaymentPlanTerminationStatus = 'terminated' | 'active';

export const paymentPlanTerminationToSuspended = (status: PaymentPlanTerminationStatus) =>
  status === 'terminated';

export const suspendedToPaymentPlanTermination = (
  isSuspended: boolean | null | undefined
): PaymentPlanTerminationStatus => (isSuspended ? 'terminated' : 'active');

export const useUpdatePaymentPlanTerminationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uniqueAssetId,
      userId,
      status,
    }: {
      uniqueAssetId: string;
      userId?: string | null;
      status: PaymentPlanTerminationStatus;
    }) => {
      const shouldSuspend = paymentPlanTerminationToSuspended(status);
      if (shouldSuspend) {
        return suspendPaymentPlan({ uniqueAssetId });
      }
      return unSuspendPaymentPlan({ uniqueAssetId });
    },
    onSuccess: (_data, { status, userId }) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['userAssets', userId] });
      }
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended-payment-plans' }) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(
        status === 'terminated'
          ? 'Payment plan marked as terminated'
          : 'Payment plan resumed - transactions are active again'
      );
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Unable to update termination status'));
    },
  });
};

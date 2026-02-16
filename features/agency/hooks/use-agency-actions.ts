import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { agencyKeys } from './query-keys';

const UPDATE_AGENCY_COMMISSION = `
  mutation UpdateAgencyCommission($updateAgencyCommissionInput: UpdateAgencyCommissionInput!) {
    updateAgencyCommission(updateAgencyCommissionInput: $updateAgencyCommissionInput) {
      success
      message
      agency {
        _id
      }
    }
  }
`;

const SUSPEND_AGENCY = `
  mutation SuspendAgency($suspendAgencyInput: SuspendAgencyInput!) {
    suspendAgency(suspendAgencyInput: $suspendAgencyInput) {
      success
      message
      agency {
        _id
      }
    }
  }
`;

const REACTIVATE_AGENCY = `
  mutation ReactivateAgency($agencyId: ID!) {
    reactivateAgency(agencyId: $agencyId) {
      success
      message
      agency {
        _id
      }
    }
  }
`;

interface AgencyActionResponse {
  success?: boolean;
  message?: string;
}

const assertSuccess = (payload: AgencyActionResponse | undefined, fallbackMessage: string) => {
  if (!payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }
};

export const useUpdateAgencyCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { agencyId: string; commission_percentage: number }) => {
      const response = await executeRaw<{ updateAgencyCommission?: AgencyActionResponse }>(
        UPDATE_AGENCY_COMMISSION,
        { updateAgencyCommissionInput: input }
      );
      assertSuccess(response.updateAgencyCommission, 'Failed to update commission');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
};

export const useSuspendAgency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { agencyId: string; reason: string }) => {
      const response = await executeRaw<{ suspendAgency?: AgencyActionResponse }>(
        SUSPEND_AGENCY,
        { suspendAgencyInput: input }
      );
      assertSuccess(response.suspendAgency, 'Failed to suspend agency');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
};

export const useReactivateAgency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      const response = await executeRaw<{ reactivateAgency?: AgencyActionResponse }>(
        REACTIVATE_AGENCY,
        { agencyId }
      );
      assertSuccess(response.reactivateAgency, 'Failed to reactivate agency');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
};

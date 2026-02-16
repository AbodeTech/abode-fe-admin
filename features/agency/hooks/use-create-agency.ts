import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { agencyKeys } from './query-keys';

const CREATE_AGENCY = `
  mutation CreateAgency($createAgencyInput: CreateAgencyInput!) {
    createAgency(createAgencyInput: $createAgencyInput) {
      success
      message
      agency {
        _id
      }
      credentials {
        agency_code
        email
        temporary_password
      }
    }
  }
`;

interface CreateAgencyInput {
  agency_name: string;
  email: string;
  phoneNumber: string;
  commission_percentage: number;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  communication_preference?: string;
}

interface CreateAgencyResponse {
  createAgency?: {
    success?: boolean;
    message?: string;
    agency?: { _id: string };
    credentials?: {
      agency_code: string;
      email: string;
      temporary_password: string;
    };
  };
}

export const useCreateAgency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (createAgencyInput: CreateAgencyInput) => {
      const result = await executeRaw<CreateAgencyResponse>(CREATE_AGENCY, { createAgencyInput });
      if (!result.createAgency?.success) {
        throw new Error(result.createAgency?.message || 'Failed to create agency');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agencyKeys.dashboard() });
    },
  });
};

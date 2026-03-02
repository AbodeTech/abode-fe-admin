import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { rolesKeys } from './query-keys';
import { UpdateAdminRoleInput } from '@/lib/gql/graphql';
import { toast } from 'sonner';

const UPDATE_ADMIN_ROLE = graphql(`
  mutation UpdateAdminRole($input: UpdateAdminRoleInput!) {
    updateAdminRole(updateAdminRoleInput: $input)
  }
`);

export const useUpdateAdminRole = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAdminRoleInput) =>
      execute(UPDATE_ADMIN_ROLE, { input }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: rolesKeys.admins() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.errors?.[0]?.message || 'Failed to update admin role. Please try again.');
    },
  });
};

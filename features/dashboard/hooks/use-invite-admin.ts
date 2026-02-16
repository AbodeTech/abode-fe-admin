import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { dashboardKeys } from './query-keys';

const INVITE_ADMIN_MUTATION = graphql(`
  mutation InviteAdmin($input: SubAdminInput!) {
    createSubAdmin(subAdminInput: $input)
  }
`);

export type InviteAdminInput = {
  email: string;
  role: 'admin' | 'subadmin';
};

export const useInviteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteAdminInput) =>
      execute(INVITE_ADMIN_MUTATION, { input }),
    onSuccess: () => {
      // Refresh dashboard data after inviting to keep counts accurate
      queryClient.invalidateQueries({ queryKey: dashboardKeys.details() });
    },
  });
};

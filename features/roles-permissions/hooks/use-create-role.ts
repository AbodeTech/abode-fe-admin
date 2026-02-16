import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { rolesKeys } from './query-keys';

const CREATE_ROLE = graphql(`
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(createRoleInput: $input) {
      _id
      name
      description
      permissions
    }
  }
`);

interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export const useCreateRole = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) =>
      execute(CREATE_ROLE, { input }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: rolesKeys.roles });
    },
  });
};

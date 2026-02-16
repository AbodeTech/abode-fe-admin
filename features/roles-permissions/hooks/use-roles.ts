import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { rolesKeys } from './query-keys';

const GET_ALL_ROLES = graphql(`
  query GetAllRoles {
    getAllRoles {
      data {
        ...RoleCardFragment
      }
    }
  }
`);

export const useRoles = () => {
  return useQuery({
    queryKey: rolesKeys.roles,
    queryFn: () => execute(GET_ALL_ROLES, {}),
    select: (data) => data.getAllRoles?.data,
  });
};

import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { rolesKeys } from './query-keys';

const GET_ADMINS_WITH_ROLES = graphql(`
  query GetAllAdminWithRoles {
    getAllAdminWithRoles {
      data {
        ...AdminRowFragment
      }
    }
  }
`);

export const useAdminsWithRoles = () => {
  return useQuery({
    queryKey: rolesKeys.admins(),
    queryFn: () => execute(GET_ADMINS_WITH_ROLES, {}),
    select: (data) => data.getAllAdminWithRoles?.data,
  });
};

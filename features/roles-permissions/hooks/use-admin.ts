import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { rolesKeys } from './query-keys';

const GET_ADMIN_WITH_ROLE = graphql(`
  query GetAdminWithRole($adminId: String!) {
    getAdminWithRole(adminId: $adminId) {
      data {
        ...AdminDetailFragment
      }
    }
  }
`);

export const useAdminWithRole = (adminId: string) => {
  return useQuery({
    queryKey: rolesKeys.admin(adminId),
    queryFn: () => execute(GET_ADMIN_WITH_ROLE, { adminId }),
    enabled: Boolean(adminId),
    select: (data) => data.getAdminWithRole?.data,
  });
};

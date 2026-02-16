import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { rolesKeys } from './query-keys';

const GET_ALL_PERMISSIONS = graphql(`
  query GetAllPermissions {
    getAllPermissions {
      data {
        ...PermissionOptionFragment
      }
    }
  }
`);

export const usePermissions = () => {
  return useQuery({
    queryKey: rolesKeys.permissions,
    queryFn: () => execute(GET_ALL_PERMISSIONS, {}),
    select: (data) => data.getAllPermissions?.data,
  });
};

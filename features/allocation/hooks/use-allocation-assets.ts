import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { allocationKeys } from './query-keys';

const GET_ALLOCATION_ASSETS_QUERY = graphql(`
  query GetAllocationAssets {
    getAllAdminAssets(page: 1, limit: 1000) {
      data {
        ...AllocationAssetOptionFragment
      }
    }
  }
`);

export const useAllocationAssets = () => {
  return useQuery({
    queryKey: allocationKeys.assets,
    queryFn: () => execute(GET_ALLOCATION_ASSETS_QUERY, {}),
    select: (data) => data.getAllAdminAssets?.data,
  });
};

export type AllocationAssetOptions = NonNullable<
  ReturnType<typeof useAllocationAssets>['data']
>;

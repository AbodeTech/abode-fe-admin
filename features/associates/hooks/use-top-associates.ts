import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { associateKeys } from './query-keys';

const GET_TOP_ASSOCIATES_QUERY = graphql(`
  query GetTopAssociates(
    $page: Int!
    $limit: Int!
    $sortBy: String
    $startDate: String
    $endDate: String
    $assetType: String
    $assetName: String
  ) {
    getTopAssociates(
      page: $page
      limit: $limit
      sortBy: $sortBy
      startDate: $startDate
      endDate: $endDate
      assetType: $assetType
      assetName: $assetName
    ) {
      count
      data {
        ...TopAssociatesTableRowFragment
      }
    }
  }
`);

export interface UseTopAssociatesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  startDate?: string | null;
  endDate?: string | null;
  assetType?: string | null;
  assetName?: string | null;
}

export const DEFAULT_TOP_ASSOCIATES_LIMIT = 25;
export const DEFAULT_TOP_ASSOCIATES_SORT = 'expected_revenue:desc';

const toOptional = (value?: string | null) => {
  if (!value || value === 'all') return undefined;
  return value;
};

export const useTopAssociates = (params: UseTopAssociatesParams) => {
  const {
    page = 1,
    limit = DEFAULT_TOP_ASSOCIATES_LIMIT,
    sortBy = DEFAULT_TOP_ASSOCIATES_SORT,
    startDate,
    endDate,
    assetType,
    assetName,
  } = params;

  const variables = {
    page,
    limit,
    sortBy,
    startDate: toOptional(startDate),
    endDate: toOptional(endDate),
    assetType: toOptional(assetType),
    assetName: toOptional(assetName),
  };

  return useQuery({
    queryKey: associateKeys.list(variables),
    queryFn: () => execute(GET_TOP_ASSOCIATES_QUERY, variables),
    select: (data) => data.getTopAssociates,
  });
};

export type TopAssociatesData = NonNullable<
  ReturnType<typeof useTopAssociates>['data']
>;

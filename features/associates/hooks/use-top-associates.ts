import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { associateKeys } from './query-keys';
import { TopAssociatesTableRowFragment } from '../components/TopAssociatesTable';

const GET_TOP_ASSOCIATES_QUERY = graphql(`
  query GetTopAssociates($page: Int!, $limit: Int!, $sortBy: String) {
    getTopAssociates(page: $page, limit: $limit, sortBy: $sortBy) {
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
  [key: string]: unknown;
}

export const DEFAULT_TOP_ASSOCIATES_LIMIT = 25;
export const DEFAULT_TOP_ASSOCIATES_SORT = 'expected_revenue:desc';

export const useTopAssociates = (params: UseTopAssociatesParams) => {
  const {
    page = 1,
    limit = DEFAULT_TOP_ASSOCIATES_LIMIT,
    sortBy = DEFAULT_TOP_ASSOCIATES_SORT,
  } = params;

  return useQuery({
    queryKey: associateKeys.list(params),
    queryFn: () =>
      execute(GET_TOP_ASSOCIATES_QUERY, {
        page,
        limit,
        sortBy,
      }),
    select: (data) => data.getTopAssociates,
  });
};

export type TopAssociatesData = NonNullable<
  ReturnType<typeof useTopAssociates>['data']
>;

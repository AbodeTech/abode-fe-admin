import { useQuery } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { associateKeys } from './query-keys';

// NOTE: assetType / assetName args are NOT yet on the local BE branch
// (feature/block-plot-allocation-v2). They exist on main. Re-add when BE
// branches merge.
// Codegen silently drops this op (under investigation); cast to a typed
// document so consumers retain inferred types.
const GET_TOP_ASSOCIATES_QUERY = graphql(`
  query GetTopAssociates(
    $page: Int!
    $limit: Int!
    $sortBy: String
    $startDate: String
    $endDate: String
  ) {
    getTopAssociates(
      page: $page
      limit: $limit
      sortBy: $sortBy
      startDate: $startDate
      endDate: $endDate
    ) {
      count
      data {
        ...TopAssociatesTableRowFragment
      }
    }
  }
`) as unknown as TypedDocumentNode<
  { getTopAssociates: { count: number; data: Array<{ [key: string]: unknown } | null> } | null },
  { page: number; limit: number; sortBy?: string; startDate?: string; endDate?: string }
>;

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

  // assetType / assetName intentionally not sent — BE branch doesn't accept them yet.
  void assetType;
  void assetName;
  const variables = {
    page,
    limit,
    sortBy,
    startDate: toOptional(startDate),
    endDate: toOptional(endDate),
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

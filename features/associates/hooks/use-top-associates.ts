import { useQuery } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';
import { associateKeys } from './query-keys';

// NOTE: this file is excluded from codegen (see codegen.ts), so the codegen
// `graphql()` helper returns `{}` at runtime and execute(print({})) crashes
// with an "AST node" error. Parse the operation manually, inlining the
// TopAssociatesTableRowFragment definition so the spread resolves at runtime.
const GET_TOP_ASSOCIATES_QUERY = parse(`
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

  fragment TopAssociatesTableRowFragment on Associate {
    name
    status
    email
    sales_person
    no_of_clients
    referred_user_count
    referred_associate_count
    referred_associate_pro_count
    units_sold
    size_sold
    expected_revenue
    received_revenue
    balance
    collection_rate
    commission
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
  } = params;

  // assetType / assetName intentionally not sent — BE branch doesn't accept them yet.
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

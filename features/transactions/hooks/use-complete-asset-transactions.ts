import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { CompleteAssetPaymentsFragment } from '../components/complete/CompleteAssetPaymentsTable';

const GET_USERS_WITH_ZERO_BALANCE = graphql(`
  query GetUsersWithZeroBalance($page: Int!, $limit: Int!) {
    getUsersWithZeroBalance(page: $page, limit: $limit) {
      count
      data {
        ...CompleteAssetPaymentsTable_data
      }
    }
  }
`);

export const DEFAULT_COMPLETE_ASSET_LIMIT = 25;

export const useCompleteAssetTransactions = (page: number, limit = DEFAULT_COMPLETE_ASSET_LIMIT) =>
  useQuery({
    queryKey: ['transactions', 'complete-assets', page, limit],
    queryFn: () => execute(GET_USERS_WITH_ZERO_BALANCE, { page, limit }),
    select: (data) => data.getUsersWithZeroBalance,
  });

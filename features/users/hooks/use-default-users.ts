import { useQuery, useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql, useFragment as getFragmentData } from '@/lib/gql';
import { userKeys } from './query-keys';
import { exportToCsv } from '../utils/export-csv';
import { DefaultUsersRowFragment } from '../components/defaults/DefaultUsersTable';



const GET_DEFAULT_USERS_QUERY = graphql(`
  query GetAllDefaultUsers($page: Int!, $limit: Int!) {
    getAllDefaultUsers(page: $page, limit: $limit) {
      count
      data {
        ...DefaultUsersRow_user
      }
    }
  }
`);

const EXPORT_DEFAULT_USERS_QUERY = graphql(`
  query ExportDefaultUsers($page: Int!, $limit: Int!) {
    getAllDefaultUsers(page: $page, limit: $limit) {
      data {
        ...DefaultUsersRow_user
      }
    }
  }
`);

export const DEFAULT_USERS_PAGE_SIZE = 25;
const EXPORT_LIMIT = 1_000_000;

export const useDefaultUsers = (page = 1, limit = DEFAULT_USERS_PAGE_SIZE) => {
  return useQuery({
    queryKey: userKeys.list({ page, limit, list: 'default' }),
    queryFn: () =>
      execute(GET_DEFAULT_USERS_QUERY, {
        page,
        limit,
      }),
    select: (data) => data.getAllDefaultUsers,
  });
};

export const useExportDefaultUsers = () => {
  return useMutation({
    mutationFn: () =>
      execute(EXPORT_DEFAULT_USERS_QUERY, {
        page: 1,
        limit: EXPORT_LIMIT,
      }),
    onSuccess: (data) => {
      const usersRaw = data.getAllDefaultUsers?.data ?? [];
      const rows = usersRaw.map((user) => getFragmentData(DefaultUsersRowFragment, user));
      const validRows = rows.filter((user): user is NonNullable<typeof user> => user !== null && user !== undefined);

      if (!validRows.length) return;

      exportToCsv(validRows, [
        { header: 'Name', accessor: (r) => `${r.lastName} ${r.firstName}`.trim() },
        { header: 'Email', accessor: (r) => r.email },
        { header: 'Phone Number', accessor: (r) => r.phoneNumber },
        { header: 'Referrer', accessor: (r) => r.referrer },
        { header: 'Product Purchased', accessor: (r) => r.subscriptions ?? 0 },
        { header: 'Networth', accessor: (r) => r.Networth ?? 0 },
        { header: 'Joined', accessor: (r) => r.createdAt },
      ], 'defaultusers.csv');
    },
  });
};

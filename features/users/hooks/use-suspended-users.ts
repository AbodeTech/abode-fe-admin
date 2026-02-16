import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql, useFragment as getFragmentData } from '@/lib/gql';
import { userKeys } from './query-keys';
import { exportToCsv } from '../utils/export-csv';
import { toast } from 'sonner';
import { SuspendedUsersRowFragment } from '../components/suspended/SuspendedUsersTable';
import { getErrorMessage } from '../utils/error-message';




const GET_SUSPENDED_USERS_QUERY = graphql(`
  query GetAllSuspendedUsers($page: Int!, $limit: Int!) {
    getAllSuspendedUsers(page: $page, limit: $limit) {
      count
      data {
        ...SuspendedUsersRow_user
      }
    }
  }
`);

const EXPORT_SUSPENDED_USERS_QUERY = graphql(`
  query ExportSuspendedUsers($page: Int!, $limit: Int!) {
    getAllSuspendedUsers(page: $page, limit: $limit) {
      data {
        ...SuspendedUsersRow_user
      }
    }
  }
`);

const UNSUSPEND_USER_MUTATION = graphql(`
  mutation UnsuspendUser($id: ID!) {
    unsuspendUser(id: $id)
  }
`);

export const SUSPENDED_USERS_PAGE_SIZE = 25;
const EXPORT_LIMIT = 1_000_000;

export const useSuspendedUsers = (page = 1, limit = SUSPENDED_USERS_PAGE_SIZE) => {
  return useQuery({
    queryKey: userKeys.list({ page, limit, list: 'suspended' }),
    queryFn: () =>
      execute(GET_SUSPENDED_USERS_QUERY, {
        page,
        limit,
      }),
    select: (data) => data.getAllSuspendedUsers,
  });
};

export const useExportSuspendedUsers = () => {
  return useMutation({
    mutationFn: () =>
      execute(EXPORT_SUSPENDED_USERS_QUERY, {
        page: 1,
        limit: EXPORT_LIMIT,
      }),
    onSuccess: (data) => {
      const usersRaw = data.getAllSuspendedUsers?.data ?? [];
      const rows = usersRaw.map((user) => getFragmentData(SuspendedUsersRowFragment, user));
      const validRows = rows.filter((user): user is NonNullable<typeof user> => user !== null && user !== undefined);

      if (!validRows.length) return;

      exportToCsv(validRows, [
        { header: 'First Name', accessor: (r) => r.firstName },
        { header: 'Last Name', accessor: (r) => r.lastName },
        { header: 'Email', accessor: (r) => r.email },
        { header: 'Phone', accessor: (r) => r.phoneNumber },
        { header: 'Referrer', accessor: (r) => r.referrer },
        { header: 'Subscriptions', accessor: (r) => r.subscriptions ?? 0 },
        { header: 'Joined', accessor: (r) => r.createdAt },
      ], 'suspended-users.csv');
    },
  });
};

export const useUnsuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => execute(UNSUSPEND_USER_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list({ list: 'suspended' }) });
      toast.success('User unsuspended');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Unable to unsuspend user'));
    },
  });
};

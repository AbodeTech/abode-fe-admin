import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { adminLogKeys } from './query-keys';

import { AdminLogsRowFragment } from '../components/AdminLogsTable';

const GET_ADMIN_LOGS_QUERY = graphql(`
  query GetAllAdminLogs($page: Int!, $limit: Int!, $adminEmail: String, $action: String) {
    getAllAdminLogs(page: $page, limit: $limit, adminEmail: $adminEmail, action: $action) {
      data {
        ...AdminLogsRowFragment
      }
      count
    }
  }
`);

export interface AdminLogFilters {
  page?: number;
  limit?: number;
  adminEmail?: string | null;
  action?: string | null;
  [key: string]: unknown;
}

export const DEFAULT_ADMIN_LOGS_LIMIT = 25;

export const useAdminLogs = (filters: AdminLogFilters) => {
  const { page = 1, limit = DEFAULT_ADMIN_LOGS_LIMIT, adminEmail, action } = filters;

  return useQuery({
    queryKey: adminLogKeys.list(filters),
    queryFn: () =>
      execute(GET_ADMIN_LOGS_QUERY, {
        page,
        limit,
        adminEmail: adminEmail || undefined,
        action: action || undefined,
      }),
    select: (data) => data.getAllAdminLogs,
  });
};

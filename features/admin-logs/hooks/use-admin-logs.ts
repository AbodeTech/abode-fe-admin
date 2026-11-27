import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import { AdminLogAdminOptionSchema, AdminLogSchema } from '../schemas/admin-log.schema';
import { adminLogKeys } from './query-keys';

// A type alias, not an interface with an index signature: an open signature let a caller pass the
// old `adminEmail` filter without a type error, and the page quietly showed everyone's logs.
export type AdminLogFilters = {
  page?: number;
  limit?: number;
  /** An admin's id (not email): the BE filters by id only. */
  adminId?: string | null;
  action?: string | null;
};

export const DEFAULT_ADMIN_LOGS_LIMIT = 25;

/**
 * GET /admin/audit-logs — newest first. Needs `view_audit_logs`.
 *
 * Returns `{ data, count }`, the shape the page already reads, so the table and
 * pagination did not change when this moved off GraphQL.
 */
export const useAdminLogs = (filters: AdminLogFilters, options?: { enabled?: boolean }) => {
  const { page = 1, limit = DEFAULT_ADMIN_LOGS_LIMIT, adminId, action } = filters;

  return useQuery({
    queryKey: adminLogKeys.list(filters),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { items, meta } = await apiGetPaged('/admin/audit-logs', AdminLogSchema, {
        params: {
          page,
          limit,
          // Omitted when empty: the BE treats any value as a filter.
          ...(adminId ? { admin_id: adminId } : {}),
          ...(action ? { action } : {}),
        },
      });
      return { data: items, count: meta.total ?? items.length };
    },
  });
};

/**
 * GET /admin/admins — who a log can be filtered to. Needs `view_admin`, which not
 * everyone with `view_audit_logs` holds, so a failure just leaves the picker
 * empty rather than breaking the page.
 */
export const useAdminLogAdminOptions = () =>
  useQuery({
    queryKey: adminLogKeys.admins(),
    queryFn: () => apiGet('/admin/admins', z.array(AdminLogAdminOptionSchema)),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

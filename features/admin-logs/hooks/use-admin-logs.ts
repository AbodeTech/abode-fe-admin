import { useQuery } from '@tanstack/react-query';
import { apiGetPaged } from '@/lib/api-client';
import { adminLogKeys } from './query-keys';
import { AdminLogSchema } from '../schemas/admin-log.schema';

export interface AdminLogFilters {
  page?: number;
  limit?: number;
  adminId?: string | null;
  action?: string | null;
  [key: string]: unknown;
}

export const DEFAULT_ADMIN_LOGS_LIMIT = 25;

export const useAdminLogs = (filters: AdminLogFilters) => {
  const { page = 1, limit = DEFAULT_ADMIN_LOGS_LIMIT, adminId, action } = filters;

  return useQuery({
    queryKey: adminLogKeys.list(filters),
    queryFn: () =>
      apiGetPaged('/admin/audit-logs', AdminLogSchema, {
        params: { page, limit, adminId: adminId || undefined, action: action || undefined },
      }),
  });
};

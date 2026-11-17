import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import {
  AdminLogAdminSchema,
  AdminLogRowSchema,
  normalizeAdminLog,
} from '../schemas/admin-log.schema';
import { adminLogKeys } from './query-keys';

export interface AdminLogFilters {
  page?: number;
  limit?: number;
  /** An admin's ObjectId. The backend casts it straight to ObjectId, so never send free text. */
  adminId?: string | null;
  action?: string | null;
}

export const DEFAULT_ADMIN_LOGS_LIMIT = 25;

/** Same rule the backend uses for ids; a bad one is a 500 there, not a 400. */
export const isObjectId = (value: string | null | undefined): value is string =>
  Boolean(value && /^[a-f0-9]{24}$/i.test(value));

export const buildAdminLogParams = (filters: AdminLogFilters) => ({
  page: filters.page ?? 1,
  limit: filters.limit ?? DEFAULT_ADMIN_LOGS_LIMIT,
  adminId: isObjectId(filters.adminId) ? filters.adminId : undefined,
  action: filters.action || undefined,
});

/** GET /admin/audit-logs — newest first. `view_audit_logs`. */
export const useAdminLogs = (filters: AdminLogFilters, enabled = true) => {
  const params = buildAdminLogParams(filters);

  return useQuery({
    enabled,
    queryKey: adminLogKeys.list(params),
    queryFn: () => apiGetPaged('/admin/audit-logs', AdminLogRowSchema, { params }),
    select: (data) => ({
      items: data.items.map(normalizeAdminLog),
      total: data.meta.total ?? 0,
    }),
  });
};

/**
 * GET /admin/admins — feeds the admin filter. Needs `view_admin`, which an
 * admin who can read logs may not have; the filter shows that instead of failing.
 */
export const useAdminLogAdmins = () =>
  useQuery({
    queryKey: adminLogKeys.admins(),
    queryFn: () => apiGet('/admin/admins', z.array(AdminLogAdminSchema)),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

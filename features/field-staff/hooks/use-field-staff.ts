'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import { AssetOptionSchema, FieldAssignmentSchema, FieldStaffDetailSchema, FieldStaffSchema } from '../schemas/field-staff.schema';
import { fieldStaffKeys, type FieldStaffListFilters } from './query-keys';

export const DEFAULT_FIELD_STAFF_LIMIT = 20;

/** GET /admin/field-staff — paged, every account state. `view_field_staff`. */
export const useFieldStaffList = (filters: FieldStaffListFilters = {}) => {
  const params: FieldStaffListFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_FIELD_STAFF_LIMIT,
    staff_type: filters.staff_type,
    status: filters.status,
    search: filters.search || undefined,
  };

  return useQuery({
    queryKey: fieldStaffKeys.staffList(params),
    queryFn: () => apiGetPaged('/admin/field-staff', FieldStaffSchema, { params }),
  });
};

/** GET /admin/field-staff/:id — the person plus every assignment they've held. */
export const useFieldStaff = (id: string | null | undefined) =>
  useQuery({
    queryKey: fieldStaffKeys.staffDetail(id ?? ''),
    enabled: !!id,
    queryFn: () => apiGet(`/admin/field-staff/${id}`, FieldStaffDetailSchema),
  });

/** GET /admin/field-staff/:id/assignments?include_ended=true — history included. */
export const useFieldAssignments = (staffId: string | null | undefined) =>
  useQuery({
    queryKey: fieldStaffKeys.assignments(staffId ?? ''),
    enabled: !!staffId,
    queryFn: () =>
      apiGet(`/admin/field-staff/${staffId}/assignments`, z.array(FieldAssignmentSchema), {
        params: { include_ended: true },
      }),
  });

/** GET /admin/assets — every estate, for the assign-site picker. The BE caps `limit` at 100. */
export const useAssetOptions = (options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: fieldStaffKeys.assetOptions(),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
    queryFn: async () => (await apiGetPaged('/admin/assets', AssetOptionSchema, { params: { limit: 100 } })).items,
  });

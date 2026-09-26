'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import type { FieldStaffType } from '../schemas/field-staff.schema';
import { PerformanceSummarySchema, SiteSetupSchema, StaffMonthSchema } from '../schemas/performance.schema';
import { fieldStaffKeys } from './query-keys';

/** GET /admin/field-performance/summary — every **active** worker of a role and their month. */
export const useFieldPerformanceSummary = (staffType: FieldStaffType, year: number, month: number) =>
  useQuery({
    queryKey: fieldStaffKeys.summary(staffType, year, month),
    queryFn: () =>
      apiGet('/admin/field-performance/summary', PerformanceSummarySchema, {
        params: { staff_type: staffType, year, month },
      }),
  });

/** GET /admin/field-performance/staff/:staffId — one person's month, site by site. */
export const useStaffMonth = (staffId: string | null | undefined, year: number, month: number) =>
  useQuery({
    queryKey: fieldStaffKeys.staffMonth(staffId ?? '', year, month),
    enabled: !!staffId,
    queryFn: () =>
      apiGet(`/admin/field-performance/staff/${staffId}`, StaffMonthSchema, { params: { year, month } }),
  });

/** GET /admin/assets/:assetId/site-setup — estate-wide fencing, clearing and parcelation from verified work. */
export const useSiteSetup = (assetId: string | null | undefined, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: fieldStaffKeys.siteSetup(assetId ?? ''),
    enabled: !!assetId && (options.enabled ?? true),
    queryFn: () => apiGet(`/admin/assets/${assetId}/site-setup`, SiteSetupSchema),
  });

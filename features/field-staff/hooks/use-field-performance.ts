'use client';

import { useQueries, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import type { FieldStaffType } from '../schemas/field-staff.schema';
import {
  AssetPlotsSchema,
  FieldBlockersSchema,
  FieldCostsSchema,
  PerformanceSummarySchema,
  SiteSetupSchema,
  StaffMonthSchema,
  StaffTrendSchema,
} from '../schemas/performance.schema';
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

/** How long a submission can wait before it's flagged as old. */
export const STALE_AFTER_DAYS = 3;

/** GET /admin/field-performance/blockers — stale reviews, people without targets, unpublished drafts. */
export const useFieldBlockers = (year: number, month: number) =>
  useQuery({
    queryKey: fieldStaffKeys.blockers(year, month, STALE_AFTER_DAYS),
    queryFn: () =>
      apiGet('/admin/field-performance/blockers', FieldBlockersSchema, {
        params: { year, month, stale_after_days: STALE_AFTER_DAYS },
      }),
  });

/** GET /admin/field-performance/trend/:staffId — the last `months` months up to now (the BE caps it at 24). */
export const useStaffTrend = (staffId: string | null | undefined, months = 6) =>
  useQuery({
    queryKey: fieldStaffKeys.staffTrend(staffId ?? '', months),
    enabled: !!staffId,
    queryFn: () =>
      apiGet(`/admin/field-performance/trend/${staffId}`, StaffTrendSchema, { params: { months } }),
  });

/** GET /admin/assets/:assetId/field-costs — the estate's verified field spending. */
export const useFieldCosts = (assetId: string | null | undefined, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: fieldStaffKeys.fieldCosts(assetId ?? ''),
    enabled: !!assetId && (options.enabled ?? true),
    queryFn: () => apiGet(`/admin/assets/${assetId}/field-costs`, FieldCostsSchema),
  });

/**
 * GET /admin/assets/:assetId/plots?block= — one request per block (up to 200
 * plots each). The BE can't fetch plots by id, so callers pass the blocks of
 * the plots they need and pick them out.
 */
export const useAssetPlotsByBlocks = (
  assetId: string | null | undefined,
  blocks: string[],
  options: { enabled?: boolean } = {}
) =>
  useQueries({
    queries: blocks.map((block) => ({
      queryKey: fieldStaffKeys.assetPlots(assetId ?? '', block),
      enabled: !!assetId && (options.enabled ?? true),
      queryFn: () =>
        apiGet(`/admin/assets/${assetId}/plots`, AssetPlotsSchema, { params: { block, limit: 200 } }),
    })),
    combine: (results) => ({
      plots: results.flatMap((r) => r.data?.plots ?? []),
      isLoading: results.some((r) => r.isLoading),
      failed: results.some((r) => r.isError),
    }),
  });

/** GET /admin/assets/:assetId/site-setup — estate-wide fencing, clearing and parcelation from verified work. */
export const useSiteSetup = (assetId: string | null | undefined, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: fieldStaffKeys.siteSetup(assetId ?? ''),
    enabled: !!assetId && (options.enabled ?? true),
    queryFn: () => apiGet(`/admin/assets/${assetId}/site-setup`, SiteSetupSchema),
  });

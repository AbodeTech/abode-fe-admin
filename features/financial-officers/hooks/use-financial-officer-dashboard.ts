'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  FinancialOfficerDashboardSchema,
  FinancialOfficersTeamDashboardSchema,
  RecoveryPlanDetailSchema,
  type RecoveryFilterKey,
} from '../schemas/financial-officer.schema';
import { financialOfficerKeys } from './query-keys';

export interface OfficerDashboardParams {
  officerId: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  filter?: RecoveryFilterKey;
  search?: string;
  enabled?: boolean;
}

/** GET /admin/financial-officers/:officer_id/dashboard */
export const useFinancialOfficerDashboard = ({
  officerId,
  month,
  year,
  page = 1,
  limit = 20,
  filter,
  search,
  enabled = true,
}: OfficerDashboardParams) =>
  useQuery({
    queryKey: financialOfficerKeys.dashboard(officerId, { month, year, page, limit, filter, search }),
    queryFn: () =>
      apiGet(`/admin/financial-officers/${officerId}/dashboard`, FinancialOfficerDashboardSchema, {
        params: { month, year, page, limit, filter, search: search || undefined },
      }),
    enabled: enabled && !!officerId,
    placeholderData: keepPreviousData,
  });

/** GET /admin/financial-officers/team-dashboard — super admin only. */
export const useFinancialOfficersTeamDashboard = ({
  month,
  year,
  enabled = true,
}: {
  month?: number;
  year?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: financialOfficerKeys.teamDashboard({ month, year }),
    queryFn: () =>
      apiGet('/admin/financial-officers/team-dashboard', FinancialOfficersTeamDashboardSchema, {
        params: { month, year },
      }),
    enabled,
    placeholderData: keepPreviousData,
  });

/**
 * GET /admin/financial-officers/recovery-plans/:plan_id?assignment_id= — the
 * drawer, for one assignment of the plan (the latest when omitted).
 */
export const useRecoveryPlan = (planId: string | null, assignmentId: string | null = null) =>
  useQuery({
    queryKey: financialOfficerKeys.recoveryPlan(planId ?? '', assignmentId),
    queryFn: () =>
      apiGet(`/admin/financial-officers/recovery-plans/${planId}`, RecoveryPlanDetailSchema, {
        params: { assignment_id: assignmentId ?? undefined },
      }),
    enabled: !!planId,
  });

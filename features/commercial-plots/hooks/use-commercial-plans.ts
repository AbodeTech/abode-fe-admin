'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged, isClientError } from '@/lib/api-client';

import {
  CommercialPlanDetailSchema,
  CommercialPlanSchema,
} from '../schemas/commercial-plan.schema';
import { commercialKeys, type CommercialPlanListFilters } from './query-keys';

/** The FO admin list defaults to 20; commercial swagger advertises the same. */
export const DEFAULT_COMMERCIAL_PLANS_LIMIT = 20;

/**
 * GET /admin/commercial/purchase/plans — `page`, `limit`, optional `suspended`.
 */
export const useCommercialPlans = (filters?: CommercialPlanListFilters) => {
  const { page = 1, limit = DEFAULT_COMMERCIAL_PLANS_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: commercialKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/commercial/purchase/plans', CommercialPlanSchema, {
        params: {
          page,
          limit,
          ...(rest.suspended === undefined ? {} : { suspended: String(rest.suspended) }),
        },
      }),
  });
};

/**
 * GET /admin/commercial/purchase/plans/:id — same FO-shaped land plan, including
 * populated buyer/asset when the BE includes them.
 */
export const useCommercialPlan = (planId: string | null | undefined) =>
  useQuery({
    queryKey: commercialKeys.detail(planId ?? ''),
    queryFn: () =>
      apiGet(`/admin/commercial/purchase/plans/${planId}`, CommercialPlanDetailSchema),
    enabled: Boolean(planId),
    retry: (failureCount, error) => !isClientError(error) && failureCount < 3,
  });

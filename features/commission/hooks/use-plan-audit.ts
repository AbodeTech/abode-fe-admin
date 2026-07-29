'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, isClientError } from '@/lib/api-client';

import { PlanAuditSchema } from '../schemas/commission.schema';
import { commissionKeys } from './query-keys';

/**
 * GET /admin/commission/audit/:paymentPlanId — the plan's frozen resolution
 * record (step 8 of the build order; unblocked 2026-07-28 when the BE started
 * shaping and populating the refs).
 *
 * Snapshot data: nothing here recomputes, so a wrong-looking number is what
 * the plan actually froze at creation, not a display bug.
 */
export const usePlanAudit = (paymentPlanId: string) =>
  useQuery({
    queryKey: commissionKeys.audit(paymentPlanId),
    queryFn: () => apiGet(`/admin/commission/audit/${paymentPlanId}`, PlanAuditSchema),
    enabled: Boolean(paymentPlanId),
    // A 404 is "no plan with this ID" — retrying won't change that.
    retry: (failureCount, error) => !isClientError(error) && failureCount < 3,
  });

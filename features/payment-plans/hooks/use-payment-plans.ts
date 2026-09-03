'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { PaymentPlanRowSchema } from '../schemas/payment-plan-row.schema';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';
import { buildPaymentPlansQueryParams } from '../lib/url-state';
import { DEFAULT_PAYMENT_PLANS_LIMIT, paymentPlansKeys } from './query-keys';

export function usePaymentPlans(
  args: FilterFormValues & { page: number; limit?: number; enabled?: boolean }
) {
  const { page, limit = DEFAULT_PAYMENT_PLANS_LIMIT, enabled = true, ...filter } = args;
  const params = buildPaymentPlansQueryParams(filter, page, limit);

  return useQuery({
    queryKey: paymentPlansKeys.list(params),
    enabled,
    queryFn: async () => {
      const { items, meta } = await apiGetPaged('/admin/payment-plans', PaymentPlanRowSchema, {
        params,
      });
      return { data: items, meta };
    },
  });
}

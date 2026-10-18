'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { PaymentPlansSummarySchema } from '../schemas/payment-plans-summary.schema';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';
import { buildPaymentPlansQueryParams } from '../lib/url-state';
import { paymentPlansKeys } from './query-keys';

export function usePaymentPlansSummary(filter: FilterFormValues, options?: { enabled?: boolean }) {
  const params = { ...buildPaymentPlansQueryParams(filter, 1, 1) };
  delete params.page;
  delete params.limit;
  delete params.sort;

  return useQuery({
    queryKey: paymentPlansKeys.summary(params),
    enabled: options?.enabled ?? true,
    queryFn: () =>
      apiGet('/admin/payment-plans/summary', PaymentPlansSummarySchema, { params }),
  });
}

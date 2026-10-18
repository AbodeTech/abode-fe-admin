'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiGetPaged, apiPost } from '@/lib/api-client';
import {
  FinanceRunSchema, PostingSchema, QueuedRunSchema, StartRunSchema,
  type PostingFilters, type RunFilters, type StartRun,
} from '../schemas/finance.schema';
import { financeKeys } from './query-keys';

export function useFinanceRuns(filters: RunFilters, enabled: boolean) {
  return useQuery({
    queryKey: financeKeys.runs(filters),
    queryFn: () => apiGetPaged('/admin/finance/expense-runs', FinanceRunSchema, { params: filters }),
    enabled,
    refetchInterval: query => query.state.data?.items.some(run => ['queued', 'running'].includes(run.status)) ? 5000 : false,
  });
}

export function useFinanceRun(id: string, enabled: boolean) {
  return useQuery({
    queryKey: financeKeys.run(id),
    queryFn: () => apiGet(`/admin/finance/expense-runs/${encodeURIComponent(id)}`, FinanceRunSchema),
    enabled: enabled && !!id,
    refetchInterval: query => query.state.data && ['queued', 'running'].includes(query.state.data.status) ? 3000 : false,
  });
}

export function useFinancePostings(filters: PostingFilters, enabled: boolean) {
  return useQuery({
    queryKey: financeKeys.postings(filters),
    queryFn: () => apiGetPaged('/admin/finance/expense-postings', PostingSchema, { params: filters }),
    enabled,
  });
}

export function useStartFinanceRun() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: StartRun) => apiPost('/admin/finance/expense-runs', StartRunSchema.parse(values), QueuedRunSchema),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: financeKeys.all }),
  });
}

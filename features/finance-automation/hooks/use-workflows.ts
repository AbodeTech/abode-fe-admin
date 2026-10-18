'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiGetPaged, apiPost } from '@/lib/api-client';
import { QueuedRunSchema } from '../schemas/finance.schema';
import { IncomePostingSchema, PayoutPostingSchema, WorkflowRunSchema, workflows, runResource, runParams, postingParams, type Workflow, type WorkflowRequest, type WorkflowFilters } from '../schemas/workflows.schema';
import { financeKeys } from './query-keys';

export function useWorkflowRuns(workflow: Workflow, filters: WorkflowFilters, enabled: boolean) {
  return useQuery({ queryKey: financeKeys.workflowRuns(workflow, filters), enabled,
    queryFn: () => apiGetPaged(`/admin/finance/${runResource(workflow)}`, WorkflowRunSchema, { params: runParams(workflow, filters) }),
    refetchInterval: query => query.state.data?.items.some(run => ['queued', 'running'].includes(run.status)) ? 5000 : false,
  });
}
export function useWorkflowRun(workflow: Workflow, id: string, enabled: boolean) {
  return useQuery({ queryKey: financeKeys.workflowRun(workflow, id), enabled: enabled && !!id,
    queryFn: () => apiGet(`/admin/finance/${runResource(workflow)}/${encodeURIComponent(id)}`, WorkflowRunSchema),
    refetchInterval: query => query.state.data && ['queued', 'running'].includes(query.state.data.status) ? 3000 : false,
  });
}
export function useWorkflowPostings(workflow: Workflow, filters: WorkflowFilters, enabled: boolean) {
  return useQuery({ queryKey: financeKeys.workflowPostings(workflow, filters), enabled: enabled && ['income', 'payouts'].includes(workflow),
    queryFn: async () => workflow === 'payouts'
      ? apiGetPaged('/admin/finance/payout-postings', PayoutPostingSchema, { params: postingParams(workflow, filters) })
      : apiGetPaged('/admin/finance/income-postings', IncomePostingSchema, { params: postingParams(workflow, filters) }),
  });
}
export function useStartWorkflow(workflow: Workflow) {
  const client = useQueryClient();
  return useMutation({ retry: false,
    mutationFn: (body: WorkflowRequest) => apiPost(`/admin/finance/${workflows[workflow].endpoint}`, workflows[workflow].schema.parse(body), QueuedRunSchema),
    onSuccess: () => client.invalidateQueries({ queryKey: financeKeys.all }),
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch, apiPost } from '@/lib/api-client';

import { AssetCostEventSchema } from '../schemas/asset-cost.schema';
import {
  runBudgetRevision,
  runStageEntry,
  type BudgetRevisionPlan,
  type CorrectDraftFormOutput,
  type ReviseCostApi,
  type ReviseProgress,
  type StageEntryPayload,
} from '../schemas/revise-cost.schema';
import { assetKeys } from './query-keys';

/**
 * The Revise modal's three kinds of save, for one cost record (see
 * `revise-cost.schema.ts` for what each one does on the backend). Every one
 * refreshes the record, the cost table and profit afterwards whether it
 * succeeded or not: a change that fails partway still leaves its earlier
 * steps saved, and the page should show them.
 */
export function useReviseCost(assetId: string, obligationId: string) {
  const queryClient = useQueryClient();

  const api: ReviseCostApi = {
    addEntry: (payload) => apiPost(`/admin/assets/${assetId}/costs/${obligationId}/stages`, payload, AssetCostEventSchema),
    approveEntry: (entryId) => apiPost(`/admin/cost-entries/${entryId}/approve`, {}, AssetCostEventSchema),
    reverseEntry: (entryId, reason) => apiPost(`/admin/cost-entries/${entryId}/reverse`, { reason }, AssetCostEventSchema),
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: assetKeys.costObligations(assetId) });
    queryClient.invalidateQueries({ queryKey: assetKeys.costCoverage(assetId) });
    queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability'] });
    queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'profitability-drilldown'] });
  };

  const addEntry = useMutation({
    mutationFn: (input: { payload: StageEntryPayload; approve: boolean; progress: ReviseProgress }) =>
      runStageEntry(api, input.payload, input.approve, input.progress),
    onSettled: refresh,
  });

  const reviseBudget = useMutation({
    mutationFn: (input: { plan: BudgetRevisionPlan; progress: ReviseProgress }) =>
      runBudgetRevision(api, input.plan, input.progress),
    onSettled: refresh,
  });

  /** PATCH /admin/cost-entries/:id — only a draft can be changed. */
  const correctDraft = useMutation({
    mutationFn: ({ entry_id, ...values }: CorrectDraftFormOutput) =>
      apiPatch(
        `/admin/cost-entries/${entry_id}`,
        {
          amount: values.amount,
          effective_date: values.effective_date,
          // Sent even when blank, so a field can be cleared.
          vendor: values.vendor ?? '',
          reference: values.reference ?? '',
          note: values.note ?? '',
        },
        AssetCostEventSchema
      ),
    onSettled: refresh,
  });

  const approve = useMutation({
    mutationFn: (entryId: string) => api.approveEntry(entryId),
    onSettled: refresh,
  });

  return { addEntry, reviseBudget, correctDraft, approve };
}

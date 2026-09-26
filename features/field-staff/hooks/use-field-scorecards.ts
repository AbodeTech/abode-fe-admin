'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPatch, apiPost } from '@/lib/api-client';

import type { FieldStaffType } from '../schemas/field-staff.schema';
import {
  FieldMetricsSchema,
  FieldScorecardSchema,
  type CreateScorecardPayload,
  type FieldMetricDefinition,
  type FieldScorecard,
  type ScorecardReasonPayload,
  type UpdateScorecardPayload,
} from '../schemas/scorecard.schema';
import { fieldStaffKeys, type ScorecardFilters } from './query-keys';

/** GET /admin/field-scorecards/metrics — what each role can be targeted on. Build pickers from this. */
export const useFieldMetrics = () =>
  useQuery({
    queryKey: fieldStaffKeys.metrics(),
    staleTime: 60 * 60_000,
    queryFn: () => apiGet('/admin/field-scorecards/metrics', FieldMetricsSchema),
  });

/** The metrics one role can be targeted on, in the BE's order. */
export const useRoleMetrics = (staffType: FieldStaffType) => {
  const query = useFieldMetrics();
  const keys = query.data?.by_staff_type[staffType] ?? [];
  const metrics = keys
    .map((key) => query.data?.metrics.find((m) => m.key === key))
    .filter((m): m is FieldMetricDefinition => !!m);
  return { metrics, isLoading: query.isLoading, error: query.error };
};

/**
 * GET /admin/field-scorecards — paged. Current versions only unless
 * `current_only: false`, which also returns replaced versions (target history).
 */
export const useFieldScorecards = (filters: ScorecardFilters, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: fieldStaffKeys.scorecardList(filters),
    enabled: options.enabled ?? true,
    queryFn: () => apiGetPaged('/admin/field-scorecards', FieldScorecardSchema, { params: filters }),
  });

/** Every scorecard write can move a score, so each one refreshes performance too. */
const useScorecardMutation = <TVars>(mutationFn: (vars: TVars) => Promise<FieldScorecard>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.scorecards() });
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.performance() });
    },
  });
};

/** POST /admin/field-scorecards — always a draft. 409 SCORECARD_EXISTS / SCORECARD_NO_ASSIGNMENT. */
export const useCreateScorecard = () =>
  useScorecardMutation((payload: CreateScorecardPayload) =>
    apiPost('/admin/field-scorecards', payload, FieldScorecardSchema)
  );

/** PATCH /admin/field-scorecards/:id — drafts and restatements only. */
export const useUpdateScorecard = () =>
  useScorecardMutation(({ id, payload }: { id: string; payload: UpdateScorecardPayload }) =>
    apiPatch(`/admin/field-scorecards/${id}`, payload, FieldScorecardSchema)
  );

/** POST /admin/field-scorecards/:id/publish — needs weights totalling exactly 100. */
export const usePublishScorecard = () =>
  useScorecardMutation((id: string) => apiPost(`/admin/field-scorecards/${id}/publish`, {}, FieldScorecardSchema));

/**
 * POST /admin/field-scorecards/:id/revise — published only. Returns a new
 * **draft** version with the targets copied; it becomes the current version
 * straight away, and the month isn't scored again until it's published.
 */
export const useReviseScorecard = () =>
  useScorecardMutation(({ id, payload }: { id: string; payload: ScorecardReasonPayload }) =>
    apiPost(`/admin/field-scorecards/${id}/revise`, payload, FieldScorecardSchema)
  );

/** POST /admin/field-scorecards/:id/finalise — published only, once the month is over. */
export const useFinaliseScorecard = () =>
  useScorecardMutation((id: string) => apiPost(`/admin/field-scorecards/${id}/finalise`, {}, FieldScorecardSchema));

/** POST /admin/field-scorecards/:id/restate — reopens a finalised month as an editable `restated` version. */
export const useRestateScorecard = () =>
  useScorecardMutation(({ id, payload }: { id: string; payload: ScorecardReasonPayload }) =>
    apiPost(`/admin/field-scorecards/${id}/restate`, payload, FieldScorecardSchema)
  );

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPost } from '@/lib/api-client';

import {
  FieldSubmissionSchema,
  SubmissionDetailSchema,
  VerifyResultSchema,
  type FieldSubmission,
  type SubmissionReasonPayload,
  type VerifySubmissionPayload,
} from '../schemas/submission.schema';
import { fieldStaffKeys, type SubmissionFilters } from './query-keys';

export const DEFAULT_SUBMISSIONS_LIMIT = 20;

/**
 * GET /admin/field-submissions — paged, newest first. With
 * `status: 'submitted'` it is the review queue. `view_field_submissions`.
 */
export const useFieldSubmissions = (filters: SubmissionFilters = {}, options: { enabled?: boolean } = {}) => {
  const params: SubmissionFilters = {
    ...filters,
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_SUBMISSIONS_LIMIT,
  };

  return useQuery({
    queryKey: fieldStaffKeys.submissionList(params),
    enabled: options.enabled ?? true,
    queryFn: () => apiGetPaged('/admin/field-submissions', FieldSubmissionSchema, { params }),
  });
};

/** GET /admin/field-submissions/:id — the record, its named plots, current warnings and written effects. */
export const useFieldSubmission = (id: string | null | undefined) =>
  useQuery({
    queryKey: fieldStaffKeys.submission(id ?? ''),
    enabled: !!id,
    queryFn: () => apiGet(`/admin/field-submissions/${id}`, SubmissionDetailSchema),
  });

/** A decision changes the queue, the detail, the scores and the roster counts. */
const useDecision = <TVars>(mutationFn: (vars: TVars) => Promise<FieldSubmission>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.performance() });
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.staff() });
    },
  });
};

/**
 * POST /admin/field-submissions/:id/verify — the work and its cost in one step.
 * 409 SUBMISSION_STALE (changed since you loaded it), SUBMISSION_ALREADY_REVIEWED,
 * SUBMISSION_WARNING_UNACKNOWLEDGED (needs `acknowledgement`). Verifying twice is a no-op.
 */
export const useVerifySubmission = () =>
  useDecision(async ({ id, payload }: { id: string; payload: VerifySubmissionPayload }) => {
    const result = await apiPost(`/admin/field-submissions/${id}/verify`, payload, VerifyResultSchema);
    return 'submission' in result ? result.submission : result;
  });

/** POST /admin/field-submissions/:id/reject — the reason goes back to the worker. */
export const useRejectSubmission = () =>
  useDecision(({ id, payload }: { id: string; payload: SubmissionReasonPayload }) =>
    apiPost(`/admin/field-submissions/${id}/reject`, payload, FieldSubmissionSchema)
  );

/** POST /admin/field-submissions/:id/reverse — takes verified work out of score, site setup and costs. */
export const useReverseSubmission = () =>
  useDecision(({ id, payload }: { id: string; payload: SubmissionReasonPayload }) =>
    apiPost(`/admin/field-submissions/${id}/reverse`, payload, FieldSubmissionSchema)
  );

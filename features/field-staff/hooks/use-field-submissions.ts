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

/** Page size and a ceiling for useAllFieldSubmissions — 1,000 records is far past a normal month. */
const ALL_PAGE_LIMIT = 100;
const ALL_MAX_PAGES = 10;

/**
 * Every submission matching the filters, following the pages. For month-level
 * rollups (the weekly breakdown) where one page might not hold the month.
 * `truncated` is true if the ceiling was hit.
 */
export const useAllFieldSubmissions = (
  filters: Omit<SubmissionFilters, 'page' | 'limit'>,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: [...fieldStaffKeys.submissions(), 'all', filters],
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const items: FieldSubmission[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await apiGetPaged('/admin/field-submissions', FieldSubmissionSchema, {
          params: { ...filters, page, limit: ALL_PAGE_LIMIT },
        });
        items.push(...res.items);
        totalPages = res.meta.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= ALL_MAX_PAGES);
      return { items, truncated: totalPages > ALL_MAX_PAGES };
    },
  });

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

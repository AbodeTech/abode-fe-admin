'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiGetPaged, apiPost, apiPut } from '@/lib/api-client';

import {
  AssetFieldAllocationSchema,
  AssetFieldPerformanceSchema,
  AssignEventOwnerResultSchema,
  EventAllocationFiguresSchema,
  FieldAssignmentSchema,
  FieldCostsSchema,
  FieldSubmissionDetailSchema,
  FieldSubmissionSchema,
  VerifySubmissionResultSchema,
  type AssignEventOwnerFormValues,
  type LinkPlotsFormValues,
  type SubmissionReasonFormValues,
  type SubmissionStatus,
  type VerifySubmissionFormValues,
} from '../schemas/field-operations.schema';
import { assetKeys } from './query-keys';

type Options = { enabled?: boolean };

/* -------------------- the review queue -------------------- */

export type FieldSubmissionFilters = {
  status?: SubmissionStatus;
  page?: number;
  limit?: number;
};

/**
 * GET /admin/field-submissions?asset_id= — the review queue and its history
 * for one estate, newest first. The endpoint is organisation-wide; this tab
 * always filters it to the estate being looked at.
 */
export const useFieldSubmissions = (assetId: string, filters: FieldSubmissionFilters = {}, options: Options = {}) =>
  useQuery({
    queryKey: assetKeys.fieldSubmissions(assetId, filters),
    queryFn: () =>
      apiGetPaged('/admin/field-submissions', FieldSubmissionSchema, {
        params: {
          asset_id: assetId,
          status: filters.status || undefined,
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
        },
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/** GET /admin/field-submissions/:id — evidence, plots, warnings and what verifying wrote. */
export const useFieldSubmission = (assetId: string, submissionId: string | null, options: Options = {}) =>
  useQuery({
    queryKey: assetKeys.fieldSubmission(assetId, submissionId ?? ''),
    queryFn: () => apiGet(`/admin/field-submissions/${submissionId}`, FieldSubmissionDetailSchema),
    enabled: Boolean(assetId) && Boolean(submissionId) && (options.enabled ?? true),
  });

/**
 * A reviewed submission moves figures all over the estate: site progress,
 * plot readiness, the worker's score and (a moment later, through an event)
 * the cost ledger. Everything of this estate's is refetched rather than
 * naming each one and missing the next.
 */
function useSubmissionMutation<TVariables, TData>(assetId: string, mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
    },
  });
}

/**
 * POST .../verify — accepts the work, its plots and its cost in one step.
 * `revision` is the one the reviewer was looking at; the backend refuses with
 * SUBMISSION_STALE if the worker changed it in the meantime.
 */
export const useVerifySubmission = (assetId: string) =>
  useSubmissionMutation(
    assetId,
    ({ submissionId, revision, ...values }: VerifySubmissionFormValues & { submissionId: string; revision: number }) =>
      apiPost(
        `/admin/field-submissions/${submissionId}/verify`,
        {
          revision,
          acknowledgement: values.acknowledgement || undefined,
          accept_proposed_boundary: values.accept_proposed_boundary || undefined,
          note: values.note || undefined,
        },
        VerifySubmissionResultSchema
      )
  );

/** POST .../reject — sends the work back with a reason; the worker can record it again. */
export const useRejectSubmission = (assetId: string) =>
  useSubmissionMutation(assetId, ({ submissionId, reason }: SubmissionReasonFormValues & { submissionId: string }) =>
    apiPost(`/admin/field-submissions/${submissionId}/reject`, { reason }, FieldSubmissionSchema)
  );

/** POST .../correct — replaces verified figures; the earlier ones stop counting everywhere. */
export const useCorrectSubmission = (assetId: string) =>
  useSubmissionMutation(
    assetId,
    ({
      submissionId,
      ...dto
    }: {
      submissionId: string;
      reason: string;
      payload?: Record<string, unknown>;
      amount_spent?: number;
    }) => apiPost(`/admin/field-submissions/${submissionId}/correct`, dto, FieldSubmissionSchema)
  );

/** POST .../reverse — undoes a verification everywhere it landed. */
export const useReverseSubmission = (assetId: string) =>
  useSubmissionMutation(assetId, ({ submissionId, reason }: SubmissionReasonFormValues & { submissionId: string }) =>
    apiPost(`/admin/field-submissions/${submissionId}/reverse`, { reason }, FieldSubmissionSchema)
  );

/** POST .../link-plots — attaches plots to unmapped clearing; the area and cost are unchanged. */
export const useLinkSubmissionPlots = (assetId: string) =>
  useSubmissionMutation(assetId, ({ submissionId, ...values }: LinkPlotsFormValues & { submissionId: string }) =>
    apiPost(
      `/admin/field-submissions/${submissionId}/link-plots`,
      { plot_ids: values.plot_ids, note: values.note || undefined },
      FieldSubmissionSchema
    )
  );

/* -------------------- costs, people, scores -------------------- */

/** GET /admin/assets/:assetId/field-costs — what verified field work has cost on this site. */
export const useFieldCosts = (assetId: string, options: Options = {}) =>
  useQuery({
    queryKey: assetKeys.fieldCosts(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/field-costs`, FieldCostsSchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/** GET /admin/assets/:assetId/field-staff — who covers this site, and (optionally) who used to. */
export const useAssetFieldStaff = (assetId: string, includeEnded = false, options: Options = {}) =>
  useQuery({
    queryKey: assetKeys.fieldStaff(assetId, includeEnded),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/field-staff`, z.array(FieldAssignmentSchema), {
        params: includeEnded ? { include_ended: true } : undefined,
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/** GET /admin/assets/:assetId/field-performance?year=&month= — the site's workers in one month. */
export const useAssetFieldPerformance = (assetId: string, year: number, month: number, options: Options = {}) =>
  useQuery({
    queryKey: assetKeys.fieldPerformance(assetId, year, month),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/field-performance`, AssetFieldPerformanceSchema, {
        params: { year, month },
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/* -------------------- allocation events on the ground -------------------- */

/**
 * Expected against confirmed for the estate's allocation events.
 *
 * GET /admin/field-allocation/assets/:assetId answers for every event that has
 * an accountable site manager, in one request. An event with no owner is not
 * in that answer, so those are read one by one from
 * GET /admin/field-allocation/events/:eventId — which is also how an event
 * gets its first owner offered.
 */
export function useFieldAllocation(assetId: string, eventIds: string[], options: Options = {}) {
  const enabled = Boolean(assetId) && (options.enabled ?? true);

  const owned = useQuery({
    queryKey: assetKeys.fieldAllocation(assetId),
    queryFn: () => apiGet(`/admin/field-allocation/assets/${assetId}`, AssetFieldAllocationSchema),
    enabled,
  });

  const ownedIds = new Set((owned.data?.events ?? []).map((row) => row.event.id));
  const unowned = eventIds.filter((id) => !ownedIds.has(id));

  const reports = useQueries({
    queries: unowned.map((eventId) => ({
      queryKey: assetKeys.fieldAllocationEvent(assetId, eventId),
      queryFn: () => apiGet(`/admin/field-allocation/events/${eventId}`, EventAllocationFiguresSchema),
      // Wait for the one-request answer first, so owned events aren't read twice.
      enabled: enabled && owned.isSuccess,
    })),
  });

  const events = [...(owned.data?.events ?? []), ...reports.flatMap((report) => (report.data ? [report.data] : []))].sort(
    (a, b) => new Date(b.event.starts_at ?? 0).getTime() - new Date(a.event.starts_at ?? 0).getTime()
  );

  return {
    events,
    isLoading: owned.isLoading || reports.some((report) => report.isLoading),
    error: owned.error ?? reports.find((report) => report.error)?.error ?? null,
  };
}

/** PUT /admin/field-allocation/events/:eventId/owner — makes a site manager accountable for an event. */
export const useAssignEventOwner = (assetId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...values }: AssignEventOwnerFormValues & { eventId: string }) =>
      apiPut(
        `/admin/field-allocation/events/${eventId}/owner`,
        { field_staff_id: values.field_staff_id, note: values.note || undefined },
        AssignEventOwnerResultSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.fieldAllocation(assetId) });
      // Ground-confirmed customers count towards the owner's score.
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'field-performance'] });
    },
  });
};

/** DELETE /admin/field-allocation/events/:eventId/owner. */
export const useRemoveEventOwner = (assetId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => apiDelete(`/admin/field-allocation/events/${eventId}/owner`, z.unknown()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.fieldAllocation(assetId) });
      queryClient.invalidateQueries({ queryKey: [...assetKeys.detail(assetId), 'field-performance'] });
    },
  });
};

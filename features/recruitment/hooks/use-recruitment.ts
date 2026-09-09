'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, apiDelete, apiGet, apiGetPaged, apiPatch, apiPost, apiPut } from '@/lib/api-client';
import { dispatchMockRequest, isMockApiEnabled } from '@/lib/mocks';

import {
  CohortDashboardSchema,
  CohortSummarySchema,
  CreateCohortInputSchema,
  CreateProgrammeInputSchema,
  ProgrammeSchema,
  ReferralRowSchema,
  RegistrantSchema,
  UpdateProgrammeInputSchema,
  UpdateRegistrantInputSchema,
  type CreateCohortInput,
  type CreateProgrammeInput,
  type Programme,
  type UpdateCohortInput,
  type UpdateProgrammeInput,
  type UpdateRegistrantInput,
} from '../schemas/programme.schema';
import {
  CohortTestSchema,
  TestAttemptSchema,
  type CreateCohortTestInput,
  type ReplaceQuestionsInput,
  type UpdateCohortTestInput,
} from '../schemas/test.schema';
import {
  DEFAULT_PROGRAMMES_LIMIT,
  DEFAULT_REGISTRANTS_LIMIT,
  recruitmentKeys,
} from './query-keys';

export { DEFAULT_PROGRAMMES_LIMIT, DEFAULT_REGISTRANTS_LIMIT };

export function useProgrammes(filters?: {
  page?: number;
  limit?: number;
  q?: string;
  is_active?: boolean;
}) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_PROGRAMMES_LIMIT;
  const params = {
    page,
    limit,
    q: filters?.q || undefined,
    is_active:
      filters?.is_active === undefined ? undefined : String(filters.is_active),
  };

  return useQuery({
    queryKey: recruitmentKeys.programmeList(params),
    queryFn: () =>
      apiGetPaged('/admin/academy/programmes', ProgrammeSchema, { params }),
  });
}

export function useProgramme(id: string) {
  return useQuery({
    queryKey: recruitmentKeys.programme(id),
    queryFn: () => apiGet(`/admin/academy/programmes/${id}`, ProgrammeSchema),
    enabled: Boolean(id),
  });
}

/**
 * The list endpoint (`useProgrammes`) never embeds each programme's `cohorts` —
 * only `GET /admin/academy/programmes/:id` does. This fetches that detail
 * endpoint per programme (sharing `useProgramme`'s cache) so callers can build
 * a flat cohort list without a dedicated "list all cohorts" endpoint.
 */
export function useProgrammesCohorts(programmeIds: string[]) {
  const results = useQueries({
    queries: programmeIds.map((id) => ({
      queryKey: recruitmentKeys.programme(id),
      queryFn: () => apiGet(`/admin/academy/programmes/${id}`, ProgrammeSchema),
      enabled: Boolean(id),
    })),
  });

  return {
    programmes: results
      .map((r) => r.data)
      .filter((p): p is Programme => Boolean(p)),
    isLoading: results.some((r) => r.isLoading),
  };
}

export function useCreateProgramme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProgrammeInput) => {
      const body = CreateProgrammeInputSchema.parse(input);
      return apiPost('/admin/academy/programmes', body, ProgrammeSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.programmes() });
    },
  });
}

export function usePatchProgramme(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProgrammeInput) => {
      const body = UpdateProgrammeInputSchema.parse(input);
      return apiPatch(`/admin/academy/programmes/${id}`, body, ProgrammeSchema);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.programmes() });
      void qc.invalidateQueries({ queryKey: recruitmentKeys.programme(id) });
    },
  });
}

export function useToggleProgrammeActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPost(
        `/admin/academy/programmes/${id}/toggle-active`,
        { is_active },
        ProgrammeSchema,
      ),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.programmes() });
      void qc.invalidateQueries({ queryKey: recruitmentKeys.programme(data.id) });
    },
  });
}

export function useCreateCohort(programmeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCohortInput) => {
      const body = CreateCohortInputSchema.parse(input);
      return apiPost(
        `/admin/academy/programmes/${programmeId}/cohorts`,
        body,
        CohortSummarySchema,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.programme(programmeId) });
      void qc.invalidateQueries({ queryKey: recruitmentKeys.programmes() });
    },
  });
}

export function useCohort(id: string) {
  return useQuery({
    queryKey: recruitmentKeys.cohort(id),
    queryFn: () => apiGet(`/admin/academy/cohorts/${id}`, CohortSummarySchema),
    enabled: Boolean(id),
  });
}

/** Shared by the three cohort-write hooks below — each is a distinct, purpose-built endpoint on the real BE. */
function useCohortWriteInvalidation(id: string) {
  const qc = useQueryClient();
  return (data: { programme_id: string }) => {
    void qc.invalidateQueries({ queryKey: recruitmentKeys.cohort(id) });
    void qc.invalidateQueries({ queryKey: recruitmentKeys.programme(data.programme_id) });
    void qc.invalidateQueries({ queryKey: recruitmentKeys.programmes() });
  };
}

/** `PATCH /admin/academy/cohorts/:id` — name, label, goal, registration window. Not `registration_open` or `is_default`. */
export function usePatchCohort(id: string) {
  const onSuccess = useCohortWriteInvalidation(id);
  return useMutation({
    mutationFn: (patch: UpdateCohortInput) =>
      apiPatch(`/admin/academy/cohorts/${id}`, patch, CohortSummarySchema),
    onSuccess,
  });
}

/** `POST /admin/academy/cohorts/:id/toggle-registration` — open/close sign-ups. */
export function useToggleCohortRegistration(id: string) {
  const onSuccess = useCohortWriteInvalidation(id);
  return useMutation({
    mutationFn: (registration_open: boolean) =>
      apiPost(`/admin/academy/cohorts/${id}/toggle-registration`, { registration_open }, CohortSummarySchema),
    onSuccess,
  });
}

/** `POST /admin/academy/cohorts/:id/set-default` — transactional default swap; no body. */
export function useSetDefaultCohort(id: string) {
  const onSuccess = useCohortWriteInvalidation(id);
  return useMutation({
    mutationFn: () => apiPost(`/admin/academy/cohorts/${id}/set-default`, {}, CohortSummarySchema),
    onSuccess,
  });
}

export function useCohortDashboard(cohortId: string, from: string, to: string) {
  return useQuery({
    queryKey: recruitmentKeys.dashboard(cohortId, from, to),
    queryFn: () =>
      apiGet(`/admin/academy/cohorts/${cohortId}/dashboard`, CohortDashboardSchema, {
        params: { from, to },
      }),
    enabled: Boolean(cohortId && from && to),
  });
}

export type RegistrantFilters = {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  was_existing?: boolean;
  checked_in?: boolean;
};

function registrantExportParams(filters?: Omit<RegistrantFilters, 'page' | 'limit'>) {
  return {
    search: filters?.search || undefined,
    region: filters?.region || undefined,
    was_existing: filters?.was_existing === undefined ? undefined : String(filters.was_existing),
    checked_in: filters?.checked_in === undefined ? undefined : String(filters.checked_in),
  };
}

/** `GET /cohorts/:id/registrants` — filters verified against `ListRegistrantsQueryDto`. */
export function useCohortRegistrants(cohortId: string, filters?: RegistrantFilters) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_REGISTRANTS_LIMIT;
  const params = { page, limit, ...registrantExportParams(filters) };

  return useQuery({
    queryKey: recruitmentKeys.registrants(cohortId, params),
    queryFn: () =>
      apiGetPaged(`/admin/academy/cohorts/${cohortId}/registrants`, RegistrantSchema, {
        params,
      }),
    enabled: Boolean(cohortId),
  });
}

function invalidateRegistrants(qc: ReturnType<typeof useQueryClient>, cohortId: string) {
  void qc.invalidateQueries({ queryKey: [...recruitmentKeys.all, 'registrants', cohortId] });
  void qc.invalidateQueries({ queryKey: [...recruitmentKeys.all, 'dashboard', cohortId] });
}

/** `PATCH /cohorts/:id/registrants/:registrantId` — allowlisted profile fields + checked_in. */
export function usePatchRegistrant(cohortId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ registrantId, patch }: { registrantId: string; patch: UpdateRegistrantInput }) => {
      const body = UpdateRegistrantInputSchema.parse(patch);
      return apiPatch(
        `/admin/academy/cohorts/${cohortId}/registrants/${registrantId}`,
        body,
        RegistrantSchema,
      );
    },
    onSuccess: () => invalidateRegistrants(qc, cohortId),
  });
}

/** `DELETE /cohorts/:id/registrants/:registrantId` — soft-delete with a reason. */
export function useDeleteRegistrant(cohortId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ registrantId, reason }: { registrantId: string; reason: string }) =>
      apiDelete(`/admin/academy/cohorts/${cohortId}/registrants/${registrantId}`, RegistrantSchema, {
        body: { reason },
      }),
    onSuccess: () => invalidateRegistrants(qc, cohortId),
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function filenameFromDisposition(headerValue: unknown, fallback: string): string {
  const disposition = String(headerValue ?? '');
  return /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallback;
}

/** `GET /cohorts/:id/registrants/export` — streaming CSV, same filters as the list. */
export function useExportRegistrants(cohortId: string) {
  return useMutation({
    mutationFn: async (filters?: Omit<RegistrantFilters, 'page' | 'limit'>) => {
      const params = registrantExportParams(filters);
      const fallbackName = `registrants-${cohortId}.csv`;
      if (isMockApiEnabled()) {
        const payload = await dispatchMockRequest({
          method: 'GET',
          path: `/admin/academy/cohorts/${cohortId}/registrants/export`,
          query: params,
          body: undefined,
        });
        downloadBlob(
          new Blob([typeof payload === 'string' ? payload : String(payload)], {
            type: 'text/csv;charset=utf-8',
          }),
          fallbackName,
        );
        return;
      }
      const response = await apiClient.get(
        `/admin/academy/cohorts/${cohortId}/registrants/export`,
        { params, responseType: 'blob' },
      );
      downloadBlob(
        response.data as Blob,
        filenameFromDisposition(response.headers['content-disposition'], fallbackName),
      );
    },
  });
}

export function useCohortReferrals(
  cohortId: string,
  filters?: { page?: number; limit?: number },
) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_REGISTRANTS_LIMIT;
  const params = { page, limit };

  return useQuery({
    queryKey: recruitmentKeys.referrals(cohortId, params),
    queryFn: () =>
      apiGetPaged(`/admin/academy/cohorts/${cohortId}/referrals`, ReferralRowSchema, {
        params,
      }),
    enabled: Boolean(cohortId),
  });
}

/** `GET /cohorts/:id/referrals/export` — streaming CSV of the full leaderboard. */
export function useExportReferrals(cohortId: string) {
  return useMutation({
    mutationFn: async () => {
      const fallbackName = `referrals-${cohortId}.csv`;
      if (isMockApiEnabled()) {
        const payload = await dispatchMockRequest({
          method: 'GET',
          path: `/admin/academy/cohorts/${cohortId}/referrals/export`,
          query: {},
          body: undefined,
        });
        downloadBlob(
          new Blob([typeof payload === 'string' ? payload : String(payload)], {
            type: 'text/csv;charset=utf-8',
          }),
          fallbackName,
        );
        return;
      }
      const response = await apiClient.get(
        `/admin/academy/cohorts/${cohortId}/referrals/export`,
        { responseType: 'blob' },
      );
      downloadBlob(
        response.data as Blob,
        filenameFromDisposition(response.headers['content-disposition'], fallbackName),
      );
    },
  });
}

export function useCohortTests(
  cohortId: string,
  filters?: { page?: number; limit?: number },
) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_REGISTRANTS_LIMIT;
  const params = { page, limit };

  return useQuery({
    queryKey: recruitmentKeys.tests(cohortId, params),
    queryFn: () =>
      apiGetPaged(`/admin/academy/cohorts/${cohortId}/tests`, CohortTestSchema, { params }),
    enabled: Boolean(cohortId),
  });
}

export function useCohortTest(testId: string) {
  return useQuery({
    queryKey: recruitmentKeys.test(testId),
    queryFn: () => apiGet(`/admin/academy/tests/${testId}`, CohortTestSchema),
    enabled: Boolean(testId),
  });
}

export function useCreateCohortTest(cohortId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCohortTestInput) =>
      apiPost(`/admin/academy/cohorts/${cohortId}/tests`, input, CohortTestSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.tests(cohortId, {}) });
      void qc.invalidateQueries({ queryKey: [...recruitmentKeys.all, 'tests', cohortId] });
    },
  });
}

export function useToggleCohortTestActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPost(`/admin/academy/tests/${id}/toggle-active`, { is_active }, CohortTestSchema),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.test(data.id) });
      void qc.invalidateQueries({
        queryKey: [...recruitmentKeys.all, 'tests', data.cohort_id],
      });
    },
  });
}

/** `PATCH /admin/academy/tests/:id` — metadata only; see useReplaceTestQuestions for questions. */
export function useUpdateCohortTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateCohortTestInput) =>
      apiPatch(`/admin/academy/tests/${id}`, input, CohortTestSchema),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.test(data.id) });
      void qc.invalidateQueries({
        queryKey: [...recruitmentKeys.all, 'tests', data.cohort_id],
      });
    },
  });
}

/** `PUT /admin/academy/tests/:id/questions` — full replace of the question set. */
export function useReplaceTestQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & ReplaceQuestionsInput) =>
      apiPut(`/admin/academy/tests/${id}/questions`, input, CohortTestSchema),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.test(data.id) });
      void qc.invalidateQueries({
        queryKey: [...recruitmentKeys.all, 'tests', data.cohort_id],
      });
    },
  });
}

export function useCohortTestAttempts(
  testId: string,
  filters?: { page?: number; limit?: number },
) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_REGISTRANTS_LIMIT;
  const params = { page, limit };

  return useQuery({
    queryKey: recruitmentKeys.testAttempts(testId, params),
    queryFn: () =>
      apiGetPaged(`/admin/academy/tests/${testId}/attempts`, TestAttemptSchema, { params }),
    enabled: Boolean(testId),
  });
}

/** `GET /admin/academy/tests/:id/attempts/export` — streaming CSV of all attempts. */
export function useExportTestAttempts(testId: string) {
  return useMutation({
    mutationFn: async () => {
      const fallbackName = `test-attempts-${testId}.csv`;
      if (isMockApiEnabled()) {
        const payload = await dispatchMockRequest({
          method: 'GET',
          path: `/admin/academy/tests/${testId}/attempts/export`,
          query: {},
          body: undefined,
        });
        downloadBlob(
          new Blob([typeof payload === 'string' ? payload : String(payload)], {
            type: 'text/csv;charset=utf-8',
          }),
          fallbackName,
        );
        return;
      }
      const response = await apiClient.get(
        `/admin/academy/tests/${testId}/attempts/export`,
        { responseType: 'blob' },
      );
      downloadBlob(
        response.data as Blob,
        filenameFromDisposition(response.headers['content-disposition'], fallbackName),
      );
    },
  });
}

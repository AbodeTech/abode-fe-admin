'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPatch, apiPost } from '@/lib/api-client';

import {
  CohortDashboardSchema,
  CohortSummarySchema,
  CreateCohortInputSchema,
  CreateProgrammeInputSchema,
  ProgrammeSchema,
  ReferralRowSchema,
  RegistrantSchema,
  type CreateCohortInput,
  type CreateProgrammeInput,
} from '../schemas/programme.schema';
import {
  CohortTestSchema,
  TestAttemptSchema,
  type CreateCohortTestInput,
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
  type?: string;
  is_active?: boolean;
}) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_PROGRAMMES_LIMIT;
  const params = {
    page,
    limit,
    q: filters?.q || undefined,
    type: filters?.type || undefined,
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

export function usePatchCohort(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      apiPatch(`/admin/academy/cohorts/${id}`, patch, CohortSummarySchema),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: recruitmentKeys.cohort(id) });
      void qc.invalidateQueries({
        queryKey: recruitmentKeys.programme(data.programme_id),
      });
    },
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

export function useCohortRegistrants(
  cohortId: string,
  filters?: { page?: number; limit?: number; search?: string },
) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? DEFAULT_REGISTRANTS_LIMIT;
  const params = { page, limit, search: filters?.search || undefined };

  return useQuery({
    queryKey: recruitmentKeys.registrants(cohortId, params),
    queryFn: () =>
      apiGetPaged(`/admin/academy/cohorts/${cohortId}/registrants`, RegistrantSchema, {
        params,
      }),
    enabled: Boolean(cohortId),
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

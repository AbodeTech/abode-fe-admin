'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { CohortCostsSchema, CreateCohortCostSchema, DeleteCohortCostSchema, UpdateCohortCostSchema, type CreateCohortCost, type DeleteCohortCost, type UpdateCohortCost } from '../schemas/cohort-cost.schema';
import { recruitmentKeys } from './query-keys';

const costsPath = (cohortId: string) => `/admin/academy/cohorts/${encodeURIComponent(cohortId)}/costs`;

export function useCohortCosts(cohortId: string, enabled: boolean) {
  return useQuery({ queryKey: recruitmentKeys.costs(cohortId), queryFn: () => apiGet(costsPath(cohortId), CohortCostsSchema), enabled: enabled && Boolean(cohortId) });
}

export function useCohortCostWrites(cohortId: string) {
  const qc = useQueryClient();
  const onSuccess = (data: ReturnType<typeof CohortCostsSchema.parse>) => {
    qc.setQueryData(recruitmentKeys.costs(cohortId), data);
    void qc.invalidateQueries({ queryKey: recruitmentKeys.analysis() });
  };
  const create = useMutation({
    mutationFn: (input: CreateCohortCost) => apiPost(costsPath(cohortId), CreateCohortCostSchema.parse(input), CohortCostsSchema), onSuccess, retry: false,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCohortCost }) => apiPatch(`${costsPath(cohortId)}/${encodeURIComponent(id)}`, UpdateCohortCostSchema.parse(input), CohortCostsSchema), onSuccess, retry: false,
  });
  const remove = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DeleteCohortCost }) => apiDelete(`${costsPath(cohortId)}/${encodeURIComponent(id)}`, CohortCostsSchema, { body: DeleteCohortCostSchema.parse(input) }), onSuccess, retry: false,
  });
  return { create, update, remove, isPending: create.isPending || update.isPending || remove.isPending };
}

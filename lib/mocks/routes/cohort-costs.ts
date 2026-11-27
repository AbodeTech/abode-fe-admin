import { z } from 'zod';
import { COHORT_COST_LABELS, CreateCohortCostSchema, DeleteCohortCostSchema, UpdateCohortCostSchema, type CohortCostEntry } from '@/features/recruitment/schemas/cohort-cost.schema';
import { MockHttpError, type MockRoutes } from '../router';

export function createCohortCostRoutes(cohortExists: (id: string) => boolean): MockRoutes {
  const entries = new Map<string, CohortCostEntry[]>();
  let sequence = 0;
  const parse = <T>(schema: z.ZodType<T>, body: unknown) => {
    const result = schema.safeParse(body);
    if (!result.success) throw new MockHttpError(400, result.error.issues.map(issue => issue.message).join('; '));
    return result.data;
  };
  const requireCohort = (id: string) => { if (!cohortExists(id)) throw new MockHttpError(404, 'Cohort not found'); };
  const list = (id: string) => {
    requireCohort(id);
    const rows = entries.get(id) ?? [];
    const money = (amount_minor: number) => ({ amount_minor, currency: 'NGN' as const });
    return {
      cohort_id: id, recorded: rows.length > 0, total: money(rows.reduce((sum, row) => sum + row.amount.amount_minor, 0)),
      by_category: Object.entries(COHORT_COST_LABELS).map(([category, label]) => ({ category, label, total: money(rows.filter(row => row.category === category).reduce((sum, row) => sum + row.amount.amount_minor, 0)) })),
      entries: [...rows].sort((a, b) => (b.incurred_on ?? '').localeCompare(a.incurred_on ?? '') || b.created_at.localeCompare(a.created_at)),
    };
  };
  const find = (cohortId: string, costId: string) => {
    requireCohort(cohortId);
    const row = entries.get(cohortId)?.find(entry => entry.id === costId);
    if (!row) throw new MockHttpError(404, 'Cost entry not found');
    return row;
  };
  return {
    'GET /admin/academy/cohorts/:id/costs': ({ params }) => list(params.id),
    'POST /admin/academy/cohorts/:id/costs': ({ params, body }) => {
      requireCohort(params.id);
      const input = parse(CreateCohortCostSchema, body);
      const now = new Date().toISOString();
      const row: CohortCostEntry = { id: `${params.id}-cost-${++sequence}`, category: input.category, label: COHORT_COST_LABELS[input.category], amount: { amount_minor: Math.round(input.amount * 100), currency: 'NGN' }, description: input.description || null, incurred_on: input.incurred_on ? new Date(`${input.incurred_on}T00:00:00+01:00`).toISOString() : null, created_by: 'mock-admin', created_at: now, updated_at: now };
      entries.set(params.id, [...(entries.get(params.id) ?? []), row]);
      return list(params.id);
    },
    'PATCH /admin/academy/cohorts/:id/costs/:costId': ({ params, body }) => {
      const row = find(params.id, params.costId);
      const input = parse(UpdateCohortCostSchema, body);
      if (input.category !== undefined) { row.category = input.category; row.label = COHORT_COST_LABELS[input.category]; }
      if (input.amount !== undefined) row.amount.amount_minor = Math.round(input.amount * 100);
      if (input.description !== undefined) row.description = input.description || null;
      if (input.incurred_on !== undefined) row.incurred_on = new Date(`${input.incurred_on}T00:00:00+01:00`).toISOString();
      row.updated_at = new Date().toISOString();
      return list(params.id);
    },
    'DELETE /admin/academy/cohorts/:id/costs/:costId': ({ params, body }) => {
      parse(DeleteCohortCostSchema, body);
      find(params.id, params.costId);
      entries.set(params.id, (entries.get(params.id) ?? []).filter(row => row.id !== params.costId));
      return list(params.id);
    },
  };
}

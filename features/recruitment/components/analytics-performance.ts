import type { z } from 'zod';
import type { AnalysisCostSchema, AnalysisMoneySchema, RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';
import type { AnalysisCohort } from './analysis-presentation';

export type AnalysisCost = z.infer<typeof AnalysisCostSchema>;
type Money = z.infer<typeof AnalysisMoneySchema>;
export const moneyText = (money: Money | null | undefined) => money ? minorText(money.amount_minor) : '—';
export const minorText = (minor: number) => new Intl.NumberFormat('en-NG', {
  style: 'currency', currency: 'NGN', maximumFractionDigits: 2,
}).format(minor / 100);
export const compactMinorText = (minor: number) => new Intl.NumberFormat('en-NG', {
  style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1,
}).format(minor / 100);
export const multipleText = (value: number | null | undefined) => value == null ? '—' : `${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })}×`;
export const costNote = (cost: AnalysisCost | undefined) => {
  if (!cost) return 'Cost data unavailable';
  if (cost.availability === 'restricted') return 'Cost viewing permission required';
  if (cost.availability === 'tracked') return cost.total.amount_minor === 0 ? 'No return ratio for zero cost' : 'Money paid per ₦1 spent';
  if (cost.reason === 'cost_not_split_by_source') return 'Costs are not split by source';
  if (cost.reason === 'cost_not_recorded_for_every_cohort') return 'Some cohort costs are missing';
  return 'Costs not recorded';
};

// Status is a frontend filter. Recalculate its totals from the same visible cohorts.
// A missing cost is never silently treated as a zero cost.
export function performanceTotals(cohorts: AnalysisCohort[]) {
  const sum = (value: (cohort: AnalysisCohort) => number | undefined) => {
    const values = cohorts.map(value);
    return !values.length || values.some(v => v === undefined) ? null : values.reduce<number>((total, v) => total + (v ?? 0), 0);
  };
  const sales = sum(c => c.performance?.contract_value.amount_minor);
  const revenue = sum(c => c.performance?.revenue.amount_minor);
  const cost = sum(c => c.performance?.cost.availability === 'tracked' ? c.performance.cost.total.amount_minor : undefined);
  const missing = cohorts.find(c => c.performance?.cost.availability !== 'tracked');
  return {
    sales, revenue, cost,
    returnOnRevenue: revenue !== null && cost !== null && cost > 0 ? revenue / cost : null,
    costNote: missing ? costNote(missing.performance?.cost) : cost === 0 ? 'No return ratio for zero cost' : !cohorts.length ? 'No cohorts selected' : 'Money paid per ₦1 spent',
  };
}

export const cohortPerformance = (data: RecruitmentAnalysis) => data.cohorts.find(c => c.id === data.filters.cohort_id)?.performance ?? data.performance;

// The aggregate currently exposes programme names, not activity applicability.
// RCP does not include these events; absence is not a tracking problem.
export function activityApplies(data: RecruitmentAnalysis, key: string) {
  if (key !== 'allocation_event' && key !== 'site_inspection') return true;
  const cohort = data.cohorts.find(c => c.id === data.filters.cohort_id) ?? (data.cohorts.length === 1 ? data.cohorts[0] : undefined);
  return !cohort || !/\brcp\b|\brealtor\s+certification\s+program(?:me)?\b/i.test(cohort.programme_name.replace(/[-_]/g, ' '));
}

export function activityShare(data: RecruitmentAnalysis, key: string) {
  if (!activityApplies(data, key)) return null;
  const row = data.activity_analysis?.rows.find(row => row.key === key);
  if (!row || row.availability !== 'tracked') return null;
  const known = row.participants + row.nonparticipants;
  return known > 0 ? row.participants / known * 100 : null;
}

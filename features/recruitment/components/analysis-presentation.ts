import type { RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';

export type AnalysisCohort = RecruitmentAnalysis['cohorts'][number];
export type AnalysisMetric = 'upgrades' | 'selling';

export const countText = (value: number | null) => value === null ? '—' : value.toLocaleString('en-NG');
export const rate = (value: number | null, total: number | null) => value === null || total === null || total <= 0 ? null : value / total * 100;
export const rateText = (value: number | null) => value === null ? '—' : `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
export const cohortStage = (cohort: AnalysisCohort) => cohort.stage_label?.trim() || (cohort.status === 'registration_open' ? 'Registration open' : 'Registration closed');
export const proCount = (cohort: AnalysisCohort) => cohort.performance?.credited_pros ?? cohort.approved_upgrades.count;
export const sellingCount = (cohort: AnalysisCohort) => cohort.performance?.selling_pros ?? (cohort.active_associate_pros.count === null ? null : cohort.active_associate_pros.confirmed_sale_only + cohort.active_associate_pros.both);
export const cohortValue = (cohort: AnalysisCohort, metric: AnalysisMetric) => metric === 'selling'
  ? rate(sellingCount(cohort), proCount(cohort))
  : rate(proCount(cohort), cohort.registrants.count);
export const goalProgress = (cohort: AnalysisCohort) => rate(cohort.registrants.count, cohort.registration_goal);

export function median(values: (number | null)[]) {
  const sorted = values.filter((value): value is number => value !== null).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length ? sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2 : null;
}

export function programmeComparisons(cohorts: AnalysisCohort[], metric: AnalysisMetric) {
  const groups = new Map<string, (number | null)[]>();
  cohorts.forEach(cohort => groups.set(cohort.programme_id, [...(groups.get(cohort.programme_id) ?? []), cohortValue(cohort, metric)]));
  return new Map(cohorts.map(cohort => {
    const baseline = median(groups.get(cohort.programme_id) ?? []);
    const value = cohortValue(cohort, metric);
    return [cohort.id, value === null || baseline === null || baseline === 0 ? null : (value / baseline - 1) * 100];
  }));
}

/** Outcome shortfalls; registration_goal is deliberately not part of this calculation. */
export function recruitmentAttention(cohorts: AnalysisCohort[], metric: AnalysisMetric) {
  // The API supplies registration status, but no closed date or maturity age.
  // Compare closed cohorts only; do not infer maturity from creation dates.
  const groups = new Map<string, { cohort: AnalysisCohort; value: number; base: number }[]>();
  for (const cohort of cohorts) {
    const value = cohortValue(cohort, metric);
    const base = metric === 'selling' ? proCount(cohort) : cohort.registrants.count;
    if (cohort.status !== 'registration_closed' || value === null || !Number.isFinite(value) || base === null || base <= 0) continue;
    const group = groups.get(cohort.programme_id) ?? [];
    group.push({ cohort, value, base });
    groups.set(cohort.programme_id, group);
  }
  let comparableCohorts = 0;
  const rows = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const baseline = median(group.map(item => item.value));
    if (baseline === null || baseline <= 0) continue;
    comparableCohorts += group.length;
    for (const item of group) {
      const belowMedian = (baseline - item.value) / baseline * 100;
      if (belowMedian < 15 - 1e-9) continue;
      // Rate difference is in percentage points; convert it to a people estimate.
      const peopleGap = (baseline - item.value) / 100 * item.base;
      rows.push({ ...item, baseline, belowMedian, peopleGap });
    }
  }
  rows.sort((a, b) => b.peopleGap - a.peopleGap || b.belowMedian - a.belowMedian || a.cohort.name.localeCompare(b.cohort.name));
  return { rows, comparableCohorts };
}

'use client';

import { CohortShell } from './CohortShell';
import { CohortCostsManager } from './CohortCostsManager';

export function CohortCostsPage({ programmeId, cohortId }: { programmeId: string; cohortId: string }) {
  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <section className="space-y-6 rounded-xl border bg-white p-5 md:p-6" aria-labelledby="cohort-costs-title">
        <header>
          <h2 id="cohort-costs-title" className="text-base font-semibold text-slate-900">Cohort costs</h2>
          <p className="mt-1 text-sm text-slate-500">Record expenses for this cohort and manage existing costs.</p>
        </header>
        <CohortCostsManager key={cohortId} cohortId={cohortId} />
      </section>
    </CohortShell>
  );
}

'use client';

import { CohortShell } from './CohortShell';

export function CohortPlaceholderPage({
  programmeId,
  cohortId,
  title,
  body,
}: {
  programmeId: string;
  cohortId: string;
  title: string;
  body: string;
}) {
  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="rounded-xl border border-dashed bg-white p-8 text-center">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{body}</p>
      </div>
    </CohortShell>
  );
}

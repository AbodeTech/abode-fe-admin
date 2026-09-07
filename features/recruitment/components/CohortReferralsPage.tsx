'use client';

import { Pagination } from '@/components/shared/Pagination';

import {
  DEFAULT_REGISTRANTS_LIMIT,
  useCohortReferrals,
} from '../hooks/use-recruitment';
import { CohortShell } from './CohortShell';

export function CohortReferralsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const { data, isLoading, error } = useCohortReferrals(cohortId, { page: 1 });
  const rows = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <p className="text-sm text-slate-500">
        Ranked by genuinely new people referred into this cohort (ABO-15).
      </p>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error.message}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Referrer</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Referred</th>
                <th className="px-3 py-2">Checked in</th>
                <th className="px-3 py-2">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    No referrals yet
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.username} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      @{r.username}
                      <div className="text-xs font-normal text-slate-500">
                        {[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.email || r.phone || '—'}</td>
                    <td className="px-3 py-2">{r.total_referred}</td>
                    <td className="px-3 py-2">{r.checked_in_count}</td>
                    <td className="px-3 py-2">{r.attendance_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination count={total} currentIdx={1} limit={DEFAULT_REGISTRANTS_LIMIT} />
    </CohortShell>
  );
}

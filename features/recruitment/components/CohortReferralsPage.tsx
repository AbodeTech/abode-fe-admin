'use client';

import { useSearchParams } from 'next/navigation';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import {
  DEFAULT_REGISTRANTS_LIMIT,
  useCohortReferrals,
  useExportReferrals,
} from '../hooks/use-recruitment';
import { CohortShell } from './CohortShell';

export function CohortReferralsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const canExport = useAdminPermissions().has('export_academy');
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const { data, isLoading, error } = useCohortReferrals(cohortId, { page });
  const exportReferrals = useExportReferrals(cohortId);
  const rows = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  async function onExport() {
    try {
      await exportReferrals.mutateAsync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  }

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Ranked by genuinely new people referred into this cohort — ties broken by total referred, then name.
        </p>
        {canExport ? (
          <Button variant="outline" size="sm" onClick={onExport} disabled={exportReferrals.isPending}>
            {exportReferrals.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        ) : null}
      </div>

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
                <th className="px-3 py-2">New</th>
                <th className="px-3 py-2">Returning</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Checked in</th>
                <th className="px-3 py-2">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
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
                    <td className="px-3 py-2">{r.new_count}</td>
                    <td className="px-3 py-2 text-slate-500">{r.returning_count}</td>
                    <td className="px-3 py-2 font-medium">{r.total_referred}</td>
                    <td className="px-3 py-2">{r.checked_in_count}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {r.session_total > 0 ? `${r.attendance_count}/${r.session_total}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination count={total} currentIdx={page} limit={DEFAULT_REGISTRANTS_LIMIT} />
    </CohortShell>
  );
}

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/shared/Pagination';
import { useDebounce } from '@/hooks/use-debounce';

import {
  DEFAULT_REGISTRANTS_LIMIT,
  useCohortRegistrants,
} from '../hooks/use-recruitment';
import { CohortShell } from './CohortShell';

export function CohortRegistrantsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('q') || '';
  const debounced = useDebounce(search);

  const { data, isLoading, error } = useCohortRegistrants(cohortId, {
    page,
    search: debounced || undefined,
  });
  const rows = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  const setSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('q', value);
    else params.delete('q');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-slate-500">{total} registrant{total === 1 ? '' : 's'}</p>
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
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Region</th>
                <th className="px-3 py-2">Referral</th>
                <th className="px-3 py-2">Check-in</th>
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
                    No registrants
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.email}</td>
                    <td className="px-3 py-2 text-slate-600">{r.region || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {r.referred_by_username
                        ? `@${r.referred_by_username}`
                        : r.referral_source || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {r.checked_in ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
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

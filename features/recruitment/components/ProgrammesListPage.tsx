'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import {
  DEFAULT_PROGRAMMES_LIMIT,
  useProgrammes,
} from '../hooks/use-recruitment';
import { PROGRAMME_TYPE_LABELS, type Programme } from '../schemas/programme.schema';

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {active ? 'Active' : 'Paused'}
    </span>
  );
}

function ProgrammeCard({ programme }: { programme: Programme }) {
  const latest = programme.latest_cohort;
  return (
    <Link
      href={`/recruitment/${programme.id}`}
      className="block rounded-xl border bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{programme.name}</h2>
            <StatusPill active={programme.is_active} />
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {PROGRAMME_TYPE_LABELS[programme.type]}
            </span>
          </div>
          {programme.description ? (
            <p className="mt-1 text-sm text-slate-500">{programme.description}</p>
          ) : null}
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>{programme.cohort_count} cohort{programme.cohort_count === 1 ? '' : 's'}</div>
          {latest ? (
            <div className="mt-1 text-slate-700">
              Latest: {latest.name}
              <span className="text-slate-400"> · {latest.registrant_count} regs</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProgrammesListPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const q = searchParams.get('q') || undefined;
  const canManage = useAdminPermissions().has('manage_academy');

  const { data, isLoading, error } = useProgrammes({ page, q });
  const rows = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Recruitment</h1>
          <p className="mt-1 text-sm text-slate-500">
            Programmes and cohorts for realtor certification and Academy intake.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/recruitment/new">
              <Plus className="mr-2 h-4 w-4" />
              New programme
            </Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          <h3 className="font-bold">Error loading programmes</h3>
          <p>{error.message}</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium text-slate-900">No programmes yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a programme and its first cohort to open registration.
          </p>
          {canManage ? (
            <Button className="mt-4" asChild>
              <Link href="/recruitment/new">Create programme</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((programme) => (
            <ProgrammeCard key={programme.id} programme={programme} />
          ))}
        </div>
      )}

      <Pagination count={total} currentIdx={page} limit={DEFAULT_PROGRAMMES_LIMIT} />
    </div>
  );
}

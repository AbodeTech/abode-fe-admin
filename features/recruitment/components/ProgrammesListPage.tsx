'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/shared/Pagination';
import { useAdminPermissions } from '@/hooks/use-admin-permission';
import { useDebounce } from '@/hooks/use-debounce';

import {
  DEFAULT_PROGRAMMES_LIMIT,
  useProgrammes,
} from '../hooks/use-recruitment';
import { type Programme } from '../schemas/programme.schema';

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
  const defaultCohort = programme.default_cohort;
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
          </div>
          {programme.description ? (
            <p className="mt-1 text-sm text-slate-500">{programme.description}</p>
          ) : null}
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>
            {programme.cohort_count} cohort{programme.cohort_count === 1 ? '' : 's'}
            {programme.open_cohort_count > 0 ? ` · ${programme.open_cohort_count} open` : ''}
          </div>
          {defaultCohort ? (
            <div className="mt-1 text-slate-700">
              Default: {defaultCohort.name}
              <span className="text-slate-400"> · {defaultCohort.registrant_count} regs</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProgrammesListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const q = searchParams.get('q') || undefined;
  const isActiveParam = searchParams.get('is_active');
  const isActive = isActiveParam === null ? undefined : isActiveParam === 'true';
  const canManage = useAdminPermissions().has('manage_academy');

  // `q` and `is_active` are both real, BE-supported filters on
  // GET /admin/academy/programmes — this page just never exposed UI for
  // either. Same URL-param pattern Pagination already uses on this page.
  const [search, setSearch] = useState(q ?? '');
  const debouncedSearch = useDebounce(search);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const params = new URLSearchParams(searchParams);
    const trimmed = debouncedSearch.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function setStatusFilter(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') params.delete('is_active');
    else params.set('is_active', value);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const { data, isLoading, error } = useProgrammes({ page, q, is_active: isActive });
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            value={isActiveParam ?? 'all'}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

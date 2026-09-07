'use client';

import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';

import { useCohortDashboard } from '../hooks/use-recruitment';
import { CohortShell } from './CohortShell';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { name: string; value: number }[] }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-slate-400">No data</li>
        ) : (
          rows.map((row) => (
            <li key={row.name} className="flex justify-between text-sm">
              <span className="text-slate-600">{row.name}</span>
              <span className="font-medium text-slate-900">{row.value}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function CohortDashboardPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const defaultRange = useMemo(
    () => ({
      from: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }),
    [],
  );
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);

  const { data, isLoading, error } = useCohortDashboard(cohortId, from, to);
  const goal = data?.cohort.registration_goal ?? 0;
  const total = data?.totalAll ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-slate-500">From</span>
          <input
            type="date"
            className="rounded-md border px-2 py-1.5 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-slate-500">To</span>
          <input
            type="date"
            className="rounded-md border px-2 py-1.5 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error.message}
        </div>
      ) : isLoading || !data ? (
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <>
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">Goal progress</span>
              <span className="text-slate-500">
                {total.toLocaleString()} / {goal.toLocaleString()} ({progress}%)
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
            </div>
            {data.cohort.event_date ? (
              <p className="mt-2 text-xs text-slate-500">
                Event {format(new Date(data.cohort.event_date), 'MMM d, yyyy')}
                {data.cohort.event_city ? ` · ${data.cohort.event_city}` : ''}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="All time" value={data.totalAll} />
            <Stat
              label="In range"
              value={data.current.count}
              hint={
                data.comparison.delta >= 0
                  ? `+${data.comparison.delta} vs prior (${data.comparison.pctChange}%)`
                  : `${data.comparison.delta} vs prior (${data.comparison.pctChange}%)`
              }
            />
            <Stat label="Avg / day" value={data.current.avgPerDay} />
            <Stat label="States covered" value={data.statesCoveredAll} />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Breakdown title="Referral source" rows={data.current.referralBreakdown} />
            <Breakdown title="Gender" rows={data.current.genderBreakdown} />
            <Breakdown title="Age" rows={data.current.ageBreakdown} />
            <Breakdown title="Status" rows={data.current.statusBreakdown} />
            <Breakdown title="Region" rows={data.current.regionBreakdown} />
            <Breakdown title="Previous attendee" rows={data.current.attendedPreviousBreakdown} />
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent registrations</h3>
            <ul className="mt-3 divide-y">
              {(data.recent_registrants as { id?: string; first_name?: string; last_name?: string; email?: string }[])
                .length === 0 ? (
                <li className="py-3 text-sm text-slate-400">None yet</li>
              ) : (
                (data.recent_registrants as {
                  id: string;
                  first_name: string;
                  last_name: string;
                  email: string;
                }[]).map((r) => (
                  <li key={r.id} className="flex justify-between py-2 text-sm">
                    <span>
                      {r.first_name} {r.last_name}
                    </span>
                    <span className="text-slate-500">{r.email}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </CohortShell>
  );
}

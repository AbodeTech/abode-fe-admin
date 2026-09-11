'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { GitCompareArrows, Percent, RefreshCw, UserCheck, Users } from 'lucide-react';

import { useCohort, useCohortDashboard } from '../hooks/use-recruitment';
import type { Outcomes } from '../schemas/programme.schema';
import {
  AgeBarChart,
  GenderBarChart,
  PreviousAttendeesDonut,
  ReferralDonutChart,
  RegionBarChart,
  RegistrationsLineChart,
  StatusDonutChart,
} from './dashboard/CohortDashboardCharts';
import { CohortDateRangePicker, type DateRange } from './dashboard/CohortDateRangePicker';
import { CohortGoalTracker } from './dashboard/CohortGoalTracker';
import { CohortStatCards } from './dashboard/CohortStatCards';
import { CohortShell } from './CohortShell';

function cohortAgeLabel(createdAt: string | undefined): string {
  if (!createdAt) return '';
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return '';
  const ageDays = Math.max(0, Math.round((Date.now() - created) / 86_400_000));
  return ageDays < 60 ? `${ageDays} days in` : `${Math.round(ageDays / 30)} months in`;
}

/**
 * DC-07 — registered → acquired → associate/pro, all-time for the cohort,
 * never date-filtered. Reshaped to match `AcademyDashboardService.computeOutcomes`
 * exactly (verified 2026-09-09): `acquired` is grouped by CURRENT tier
 * (still_guest/user/associate/associate_pro), never summed with `influenced`
 * (already-here registrants who went pro after this drive).
 */
function OutcomesBlock({ outcomes, ageLabel }: { outcomes: Outcomes; ageLabel: string }) {
  const acquiredTotal = outcomes.acquired.total;
  const pct = (n: number) => (acquiredTotal > 0 ? Math.round((n / acquiredTotal) * 1000) / 10 : 0);
  const stages: { label: string; value: number; hint?: string }[] = [
    { label: 'Acquired (new)', value: acquiredTotal },
    { label: 'Still guest', value: outcomes.acquired.still_guest, hint: `${pct(outcomes.acquired.still_guest)}%` },
    { label: 'Associate', value: outcomes.acquired.associate, hint: `${pct(outcomes.acquired.associate)}%` },
    {
      label: 'Associate-pro',
      value: outcomes.acquired.associate_pro,
      hint: `${pct(outcomes.acquired.associate_pro)}%${
        outcomes.median_days_to_pro != null ? ` · median ${outcomes.median_days_to_pro} days` : ''
      }`,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Outcomes — what this drive produced</h3>
        <span className="text-xs text-slate-400">
          as of {format(new Date(outcomes.as_of), 'MMM d')}
          {ageLabel ? ` · ${ageLabel}` : ''} · not date-filtered
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="relative">
            <div className="text-xs uppercase tracking-wide text-slate-400">{stage.label}</div>
            <div className="mt-1 text-xl font-bold text-slate-900">{stage.value.toLocaleString()}</div>
            {stage.hint ? <div className="text-xs text-slate-500">{stage.hint}</div> : null}
            {idx < stages.length - 1 ? (
              <span className="pointer-events-none absolute -right-2.5 top-2 hidden text-slate-300 sm:inline">→</span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
        <p>
          {outcomes.influenced.became_pro_after.toLocaleString()} of{' '}
          {outcomes.influenced.total.toLocaleString()} already-here registrants became pro after this drive
          (never summed with acquired)
        </p>
      </div>
    </div>
  );
}

function NewVsReturning({ newCount, returningCount }: { newCount: number; returningCount: number }) {
  const cards = [
    { label: 'New registrants', value: newCount, icon: Users, color: 'text-[#E8713A]', bg: 'bg-[#E8713A]/10' },
    { label: 'Returning registrants', value: returningCount, icon: Users, color: 'text-[#02B8CF]', bg: 'bg-[#02B8CF]/10' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
              <Icon size={16} className={card.color} />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}

/** `null` until the cohort has a physical session (Phase 2) — verified against `AcademyDashboardService`. */
function CheckedInStats({ count, rate }: { count: number; rate: number }) {
  const cards = [
    { label: 'Checked in', value: count, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Check-in rate', value: `${rate}%`, icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div>
      <h2 className="mb-3 text-sm font-bold text-slate-700">Physical-session attendance</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon size={16} className={card.color} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
              <p className={`mt-1.5 text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyComparisonTable({ data }: { data: { date: string; count: number }[] }) {
  const weeks: { label: string; total: number; avg: number; days: number }[] = [];
  let i = 0;
  while (i < data.length) {
    const chunk = data.slice(i, i + 7);
    const total = chunk.reduce((s, d) => s + d.count, 0);
    const start = format(new Date(chunk[0].date), 'MMM d');
    const end = format(new Date(chunk[chunk.length - 1].date), 'MMM d');
    weeks.push({ label: `${start} - ${end}`, total, avg: Math.round((total / chunk.length) * 10) / 10, days: chunk.length });
    i += 7;
  }

  if (weeks.length < 2) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-bold text-slate-900">Week-by-week comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Week</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Registrations</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Avg/day</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Change</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, idx) => {
              const prev = idx > 0 ? weeks[idx - 1] : null;
              const delta = prev ? week.total - prev.total : 0;
              const pct = prev && prev.total > 0 ? Math.round((delta / prev.total) * 100) : 0;
              return (
                <tr key={week.label} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 font-medium text-slate-900">{week.label}</td>
                  <td className="px-6 py-3 text-right font-semibold tabular-nums text-slate-900">{week.total}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-500">{week.avg}</td>
                  <td className="px-6 py-3 text-right">
                    {prev ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          delta > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : delta < 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {delta > 0 ? '+' : ''}
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentRegistrations({
  rows,
  programmeId,
  cohortId,
}: {
  rows: { id?: string; first_name?: string; last_name?: string; email?: string; region?: string | null; status?: string | null }[];
  programmeId: string;
  cohortId: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-bold text-slate-900">Recent registrations</h3>
        <Link
          href={`/recruitment/${programmeId}/cohorts/${cohortId}/registrants`}
          className="text-xs font-semibold text-[#E8713A] hover:text-[#E8713A]/80"
        >
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Region</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  No registrations yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{r.email}</td>
                  <td className="px-6 py-3 text-slate-500">{r.region ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {r.status ?? '—'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
  const [range, setRange] = useState<DateRange>(() => ({
    from: subDays(new Date(), 29),
    to: new Date(),
    label: 'Last 30 days',
  }));
  const [showComparison, setShowComparison] = useState(true);

  const from = useMemo(() => format(range.from, 'yyyy-MM-dd'), [range.from]);
  const to = useMemo(() => format(range.to, 'yyyy-MM-dd'), [range.to]);

  const { data, isLoading, error, refetch, isFetching } = useCohortDashboard(cohortId, from, to);
  // The dashboard payload's `cohort` is minimal (id/label/registration_goal) —
  // registration_closes and createdAt live on the full cohort record.
  const { data: cohort } = useCohort(cohortId);

  const handleRangeChange = useCallback((next: DateRange) => setRange(next), []);

  const goal = data?.cohort.registration_goal ?? 0;
  const total = data?.totalAll ?? 0;
  const current = data?.current;
  const previous = data?.previous;
  const comparison = data?.comparison;
  const recentRows = data?.recent_registrants ?? [];

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {range.label} · {format(range.from, 'MMM d')} - {format(range.to, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              showComparison
                ? 'border-[#E8713A]/30 bg-[#E8713A]/5 text-[#E8713A]'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <GitCompareArrows size={13} />
            Compare
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
          <CohortDateRangePicker value={range} onChange={handleRangeChange} />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">{error.message}</div>
      ) : isLoading || !data ? (
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <CohortGoalTracker
            total={total}
            goal={goal}
            deadline={cohort?.registration_closes}
            dailyAvg={current?.avgPerDay ?? 0}
          />

          <CohortStatCards
            total={total}
            periodCount={current?.count ?? 0}
            statesCovered={data.statesCoveredAll}
            avgPerDay={current?.avgPerDay ?? 0}
            comparison={showComparison ? comparison : undefined}
            rangeLabel={range.label}
          />

          {current ? (
            <NewVsReturning newCount={current.new_count} returningCount={current.returning_count} />
          ) : null}

          <OutcomesBlock outcomes={data.outcomes} ageLabel={cohortAgeLabel(cohort?.createdAt)} />

          {data.checked_in ? (
            <CheckedInStats count={data.checked_in.count} rate={data.checked_in.rate} />
          ) : null}

          {showComparison && comparison ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-linear-to-r from-slate-50 to-white px-5 py-3">
              <GitCompareArrows size={16} className="text-slate-400" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{current?.count ?? 0}</span> registrations in this
                period vs <span className="font-semibold text-slate-900">{previous?.count ?? 0}</span> in the
                previous {data.rangeDays}-day period.{' '}
                {comparison.delta > 0 ? (
                  <span className="font-semibold text-emerald-600">+{comparison.pctChange}% growth</span>
                ) : comparison.delta < 0 ? (
                  <span className="font-semibold text-rose-600">{comparison.pctChange}% decline</span>
                ) : (
                  <span className="text-slate-400">No change</span>
                )}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RegistrationsLineChart
              data={current?.dailyRegistrations ?? []}
              prevData={previous?.dailyRegistrations}
              showComparison={showComparison}
            />
            <ReferralDonutChart data={current?.referralBreakdown ?? []} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <GenderBarChart data={current?.genderBreakdown ?? []} />
            <AgeBarChart data={current?.ageBreakdown ?? []} />
            <StatusDonutChart data={current?.statusBreakdown ?? []} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PreviousAttendeesDonut data={current?.attendedPreviousBreakdown ?? []} />
            <ReferralDonutChart data={current?.returning_by_tier ?? []} title="Returning registrants by tier" />
          </div>

          <RegionBarChart data={current?.regionBreakdown ?? []} />

          {showComparison && current?.dailyRegistrations ? (
            <WeeklyComparisonTable data={current.dailyRegistrations} />
          ) : null}

          <RecentRegistrations rows={recentRows} programmeId={programmeId} cohortId={cohortId} />
        </>
      )}
    </CohortShell>
  );
}

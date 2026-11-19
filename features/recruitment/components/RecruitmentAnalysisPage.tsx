'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  FilterX,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';

import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useRecruitmentAnalysis,
  useRecruitmentAnalysisPeople,
  type RecruitmentAnalysisFilters,
} from '../hooks/use-recruitment';
import {
  RecruitmentFollowUpSchema,
  RecruitmentStageSchema,
  type RecruitmentAnalysis,
  type RecruitmentFollowUp,
  type RecruitmentStage,
} from '../schemas/recruitment-analysis.schema';

const EMPTY_FILTERS: RecruitmentAnalysisFilters = {};
const PEOPLE_LIMIT = 25;
type DatePreset = 'all' | '30' | '90' | 'year';
type ComparisonTab = 'programmes' | 'events' | 'sources' | 'cohorts';
type DrillSelection = {
  kind: 'stage' | 'follow_up';
  value: RecruitmentStage | RecruitmentFollowUp;
  cohortId?: string;
};

const STAGES: { key: RecruitmentStage; metric: keyof RecruitmentAnalysis['summary']; label: string; definition: string }[] = [
  { key: 'registrant', metric: 'registrants', label: 'Registrants', definition: 'People registered for a recruitment cohort.' },
  { key: 'attendee', metric: 'attendees', label: 'Attendees', definition: 'Registrants with recorded attendance.' },
  { key: 'test_participant', metric: 'test_participants', label: 'Test participants', definition: 'Registrants who attempted a cohort test.' },
  { key: 'test_pass', metric: 'test_passes', label: 'Test passes', definition: 'Registrants who met the test passing requirement.' },
  { key: 'course_completion', metric: 'course_completions', label: 'Course completions', definition: 'Registrants recorded as completing an Academy course.' },
  { key: 'approved_upgrade', metric: 'approved_upgrades', label: 'Associate Pro upgrades', definition: 'Registrants whose Associate Pro upgrade was approved.' },
  { key: 'active_associate_pro', metric: 'active_associate_pros', label: 'Active Associate Pros', definition: 'Approved Associate Pros with a confirmed sale or a later approved recruit.' },
];

const FOLLOW_UPS: { key: RecruitmentFollowUp; label: string; from: RecruitmentStage; to: RecruitmentStage }[] = [
  { key: 'registered_without_attendance', label: 'Registered, no attendance', from: 'registrant', to: 'attendee' },
  { key: 'attended_without_test_attempt', label: 'Attended, no test attempt', from: 'attendee', to: 'test_participant' },
  { key: 'passed_without_course_completion', label: 'Passed, course not completed', from: 'test_pass', to: 'course_completion' },
  { key: 'completed_without_approved_upgrade', label: 'Completed, not upgraded', from: 'course_completion', to: 'approved_upgrade' },
];

const COMPARISON_TABS: { key: ComparisonTab; label: string; heading: string }[] = [
  { key: 'programmes', label: 'Programme', heading: 'Programme' },
  { key: 'events', label: 'Event', heading: 'Event' },
  { key: 'sources', label: 'Referral source', heading: 'Referral source' },
  { key: 'cohorts', label: 'Cohort', heading: 'Cohort' },
];

function datePartsInLagos(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function dateString(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function dateWindow(preset: DatePreset) {
  if (preset === 'all') return {};
  const { year, month, day } = datePartsInLagos();
  const to = dateString(year, month, day);
  if (preset === 'year') return { cohort_started_from: `${year}-01-01`, cohort_started_to: to };
  const firstDay = new Date(Date.UTC(year, month - 1, day - (Number(preset) - 1)));
  return {
    cohort_started_from: firstDay.toISOString().slice(0, 10),
    cohort_started_to: to,
  };
}

function readPreset(value: string | null): DatePreset {
  return value === '30' || value === '90' || value === 'year' ? value : 'all';
}

function formatDateRange(from?: string, to?: string) {
  if (!from || !to) return 'All cohort start dates';
  const fmt = (value: string, options: Intl.DateTimeFormatOptions = {}) =>
    new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', timeZone: 'UTC', ...options })
      .format(new Date(`${value}T12:00:00Z`));
  return `${fmt(from)} - ${fmt(to, { year: 'numeric' })}`;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Update time unavailable';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(date);
}

function cohortAge(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (!Number.isFinite(days)) return 'Start date unavailable';
  return `Started ${days} day${days === 1 ? '' : 's'} ago`;
}

function numberText(value: number | null | undefined) {
  return value == null ? '—' : value.toLocaleString('en-NG');
}

function percentText(value: number | null | undefined) {
  return value == null ? null : `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function breakdownText(metric: { acquired: number | null; influenced: number | null; unclassified: number | null }) {
  return `New ${numberText(metric.acquired)} · Existing users influenced ${numberText(metric.influenced)}${metric.unclassified ? ` · Unclassified ${numberText(metric.unclassified)}` : ''}`;
}

function useAnalysisFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preset = readPreset(searchParams.get('period'));
  const dates = dateWindow(preset);
  const programmeId = searchParams.get('programme_id') ?? undefined;
  const cohortId = searchParams.get('cohort_id') ?? undefined;
  const source = searchParams.get('source') ?? undefined;
  const filters = useMemo<RecruitmentAnalysisFilters>(() => ({
    ...dates,
    programme_id: programmeId,
    cohort_id: cohortId,
    source,
  }), [preset, programmeId, cohortId, source]);

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete('people_page');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return { filters, preset, programmeId, cohortId, source, update };
}

function CardTitle({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {aside ? <span className="text-[11px] text-slate-400">{aside}</span> : null}
    </div>
  );
}

function MetricButton({
  value,
  onClick,
  unavailable = false,
}: {
  value: number | null;
  onClick: () => void;
  unavailable?: boolean;
}) {
  if (unavailable || value === null) {
    return <span className="text-xs font-semibold text-amber-700">No data recorded</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-1.5 py-0.5 text-left font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={`View ${value.toLocaleString('en-NG')} people`}
    >
      {numberText(value)}
    </button>
  );
}

function AnalysisFilters({
  preset,
  programmeId,
  cohortId,
  source,
  options,
  update,
}: {
  preset: DatePreset;
  programmeId?: string;
  cohortId?: string;
  source?: string;
  options: RecruitmentAnalysis['filter_options'];
  update: (changes: Record<string, string | null>) => void;
}) {
  const cohorts = options.cohorts.filter((cohort) => !programmeId || cohort.programme_id === programmeId);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mr-1 flex items-center gap-1.5 px-1 text-xs font-bold tracking-wide text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" /> FILTERS
      </span>
      <Select value={preset} onValueChange={(value) => update({ period: value === 'all' ? null : value })}>
        <SelectTrigger className="w-full bg-slate-50 sm:w-[165px]"><SelectValue placeholder="Date range" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
      <Select value={programmeId ?? 'all'} onValueChange={(value) => update({ programme_id: value === 'all' ? null : value, cohort_id: null })}>
        <SelectTrigger className="w-full bg-slate-50 sm:w-[220px]"><SelectValue placeholder="Programme" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All programmes</SelectItem>
          {options.programmes.map((programme) => <SelectItem key={programme.id} value={programme.id}>{programme.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={cohortId ?? 'all'} onValueChange={(value) => update({ cohort_id: value === 'all' ? null : value })}>
        <SelectTrigger className="w-full bg-slate-50 sm:w-[220px]"><SelectValue placeholder="Cohort" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All cohorts</SelectItem>
          {cohorts.map((cohort) => <SelectItem key={cohort.id} value={cohort.id}>{cohort.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={source ?? 'all'} onValueChange={(value) => update({ source: value === 'all' ? null : value })}>
        <SelectTrigger className="w-full bg-slate-50 sm:w-[180px]"><SelectValue placeholder="Referral source" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {options.sources.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {(preset !== 'all' || programmeId || cohortId || source) ? (
        <Button variant="ghost" size="sm" onClick={() => update({ period: null, programme_id: null, cohort_id: null, source: null })} className="ml-auto text-emerald-800">
          <FilterX className="mr-1.5 h-4 w-4" /> Reset filters
        </Button>
      ) : null}
    </div>
  );
}

function SummaryCards({ data, onOpen }: { data: RecruitmentAnalysis; onOpen: (stage: RecruitmentStage) => void }) {
  const summary = data.summary;
  const denom = summary.registrants.count;
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {STAGES.map((stage, index) => {
        const metric = summary[stage.metric];
        const value = metric.count;
        const share = index === 0 ? null : index === STAGES.length - 1
          ? (value !== null && summary.approved_upgrades.count ? value / summary.approved_upgrades.count * 100 : null)
          : (value !== null && denom ? value / denom * 100 : null);
        const coverage = data.coverage[stage.metric];
        return (
          <button
            key={stage.key}
            type="button"
            onClick={() => onOpen(stage.key)}
            disabled={value === null}
            className={`group min-h-[122px] rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:shadow ${index >= 5 ? 'border-emerald-200 bg-linear-to-br from-white to-emerald-50/70' : 'border-slate-200'} disabled:cursor-default`}
          >
            <span className="text-xs font-semibold text-slate-500">{stage.label}</span>
            <span className={`mt-2 block text-2xl font-bold tracking-tight ${index >= 5 ? 'text-emerald-800' : 'text-slate-900'}`}>
              {value === null ? <span className="text-sm font-semibold text-amber-700">No data recorded</span> : numberText(value)}
            </span>
            {index === 0 || index === 5 ? (
              <span className="mt-1 block text-[10px] text-slate-500">{breakdownText(metric)}</span>
            ) : share !== null ? (
              <span className="mt-1 block text-[11px] text-slate-500">
                {numberText(value)} of {numberText(index === STAGES.length - 1 ? summary.approved_upgrades.count : denom)} {index === STAGES.length - 1 ? 'approved upgrades' : 'registrants'} · <b className="text-emerald-800">{percentText(share)}</b>
              </span>
            ) : null}
            {coverage.missing_segments > 0 ? (
              <span className="mt-1 block text-[10px] font-medium text-amber-700">
                {coverage.missing_segments} cohort{coverage.missing_segments === 1 ? '' : 's'} without tracked data
              </span>
            ) : null}
            <span className="sr-only">{stage.definition}</span>
          </button>
        );
      })}
    </section>
  );
}

function Journey({ data, onOpen }: { data: RecruitmentAnalysis; onOpen: (stage: RecruitmentStage) => void }) {
  const max = data.summary.registrants.count ?? 0;
  const stageLabels = new Map(data.journey.map((item) => [item.stage, item.label]));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-[minmax(95px,1.15fr)_minmax(65px,2fr)_48px_minmax(100px,1.25fr)] items-center gap-x-3 gap-y-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:grid-cols-[150px_minmax(100px,2fr)_60px_minmax(180px,1.6fr)]">
        <span>Stage</span><span>Progress</span><span className="text-right">Count</span><span>Conversion</span>
        {data.journey.map((item) => {
          const width = item.count === null || max === 0 ? 0 : Math.max(2, item.count / max * 100);
          const denominatorLabel = item.denominator_stage ? stageLabels.get(item.denominator_stage) : null;
          const conversion = item.denominator_stage
            ? `${numberText(item.count)} of ${numberText(item.denominator_count)} ${denominatorLabel?.toLowerCase() ?? 'previous stage'}${percentText(item.conversion_rate) ? ` · ${percentText(item.conversion_rate)}` : ''}`
            : '—';
          return (
            <div key={item.stage} className="contents">
              <button type="button" onClick={() => onOpen(item.stage)} disabled={item.count === null} className="py-2 text-left text-xs font-semibold normal-case tracking-normal text-slate-700 hover:text-emerald-800 disabled:text-amber-700">
                {item.count === null ? <span className="text-amber-700">{item.label} · No data recorded</span> : item.label}
              </button>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-label={`${item.label} progress`}>
                <div className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-700 transition-all" style={{ width: `${width}%` }} />
              </div>
              <button type="button" onClick={() => onOpen(item.stage)} disabled={item.count === null} className="text-right text-xs font-bold text-slate-800 hover:text-emerald-800 disabled:text-amber-700">
                {numberText(item.count)}
              </button>
              <div className="text-[10px] font-normal normal-case tracking-normal text-slate-500">
                {conversion}
                {item.missing_cohorts > 0 ? <span className="ml-1 text-amber-700">({item.missing_cohorts} cohort{item.missing_cohorts === 1 ? '' : 's'} untracked)</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        Conversion uses the previous stage with recorded data as its denominator. Each figure opens the people counted.
      </p>
    </div>
  );
}

function Comparison({ data, activeTab, setActiveTab }: { data: RecruitmentAnalysis; activeTab: ComparisonTab; setActiveTab: (tab: ComparisonTab) => void }) {
  const tab = COMPARISON_TABS.find((item) => item.key === activeTab)!;
  const rows = data.comparison[activeTab];
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Compare recruitment by">
        {COMPARISON_TABS.map((item) => (
          <button key={item.key} type="button" role="tab" aria-selected={activeTab === item.key} onClick={() => setActiveTab(item.key)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${activeTab === item.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left text-xs">
          <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><th className="px-3 py-3">{tab.heading}</th><th className="px-3 py-3">Registrants</th><th className="px-3 py-3">Approved upgrades</th><th className="px-3 py-3">Active APs</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-slate-400">No comparison data matches these filters.</td></tr> : rows.map((row, index) => {
              const upgradesRate = row.registrants ? row.approved_upgrades / row.registrants * 100 : null;
              const activeRate = row.approved_upgrades ? row.active_associate_pros / row.approved_upgrades * 100 : null;
              const name = 'name' in row ? row.name : ('value' in row ? row.value : '—');
              const key = 'id' in row ? row.id ?? `unattributed-${index}` : ('value' in row ? row.value : String(index));
              return (
                <tr key={key} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-3 font-semibold text-slate-700">{name || 'Unattributed'}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-600">{numberText(row.registrants)}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-600">{row.approved_upgrades} of {row.registrants} · <b>{percentText(upgradesRate)}</b></td>
                  <td className="px-3 py-3 tabular-nums text-slate-600">{row.active_associate_pros} of {row.approved_upgrades} · <b>{percentText(activeRate)}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-[11px] text-amber-900">
        Compare approved upgrades and active Associate Pros, not registrations alone.
      </div>
    </section>
  );
}

function CohortTable({ data, onOpen }: { data: RecruitmentAnalysis; onOpen: (stage: RecruitmentStage, cohortId: string) => void }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-xs">
          <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wide text-slate-400"><th className="px-4 py-3">Cohort</th><th className="px-4 py-3">Registration</th><th className="px-4 py-3">Registrants</th><th className="px-4 py-3">Goal · progress</th><th className="px-4 py-3">Upgrades</th><th className="px-4 py-3">Active APs</th><th className="px-4 py-3">Data check</th></tr></thead>
          <tbody>
            {data.cohorts.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-slate-400">No cohorts match these filters.</td></tr> : data.cohorts.map((cohort) => {
              const count = cohort.registrants.count;
              const goal = cohort.registration_goal;
              const progress = count === null || goal <= 0 ? 0 : Math.min(100, count / goal * 100);
              const statusOpen = cohort.status === 'registration_open';
              const missingLabels = cohort.missing_stages.map((stage) => STAGES.find((item) => item.key === stage)?.label ?? stage);
              return (
                <tr key={cohort.id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-800">{cohort.name}<span className="mt-1 block font-normal text-slate-400">{cohort.programme_name}{cohort.event_name ? ` · ${cohort.event_name}` : ''}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusOpen ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>{statusOpen ? 'Registration open' : 'Registration closed'}</span><span className="mt-1 block text-[10px] text-slate-400">{cohort.stage_label ?? cohortAge(cohort.created_at)}</span></td>
                  <td className="px-4 py-3"><MetricButton value={count} onClick={() => onOpen('registrant', cohort.id)} /><span className="mt-1 block text-[10px] text-slate-400">{breakdownText(cohort.registrants)}</span></td>
                  <td className="px-4 py-3"><span className="tabular-nums text-slate-600">{numberText(goal)} registrations</span><span className="mt-2 flex items-center gap-2"><span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></span><span className="text-[10px] text-slate-400">{percentText(progress) ?? '—'}</span></span></td>
                  <td className="px-4 py-3"><MetricButton value={cohort.approved_upgrades.count} onClick={() => onOpen('approved_upgrade', cohort.id)} /><span className="mt-1 block text-[10px] text-slate-400">{breakdownText(cohort.approved_upgrades)}</span></td>
                  <td className="px-4 py-3"><MetricButton value={cohort.active_associate_pros.count} onClick={() => onOpen('active_associate_pro', cohort.id)} /></td>
                  <td className="max-w-56 px-4 py-3">{missingLabels.length ? <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-[10px] leading-4 text-amber-800">{missingLabels.join(', ')} not recorded</span> : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><Check className="h-3.5 w-3.5" /> Tracking available</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActivityAndFollowUp({ data, onOpenFollowUp }: { data: RecruitmentAnalysis; onOpenFollowUp: (followUp: RecruitmentFollowUp) => void }) {
  const active = data.summary.active_associate_pros;
  const total = active.count ?? 0;
  const saleOnly = active.confirmed_sale_only;
  const recruitOnly = active.approved_recruit_only;
  const both = active.both;
  const saleTotal = saleOnly + both;
  const recruitTotal = recruitOnly + both;
  const segments = [
    { label: 'Confirmed sale only', value: saleOnly, className: 'bg-emerald-700' },
    { label: 'Approved recruit only', value: recruitOnly, className: 'bg-emerald-400' },
    { label: 'Both', value: both, className: 'bg-teal-200' },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <section className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-sm font-bold text-slate-900">What makes an Associate Pro active?</h2><p className="mt-1 text-xs text-slate-500">At least one confirmed sale or a recruit with an approved upgrade.</p></div>
          <div className="shrink-0 text-right text-2xl font-bold text-emerald-800">{numberText(active.count)}<span className="block text-[10px] font-normal text-slate-400">active Associate Pros</span></div>
        </div>
        {active.count === null ? <p className="mt-7 text-sm font-semibold text-amber-700">No data recorded</p> : (
          <>
            <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label="Active Associate Pro activity breakdown">
              {segments.map((segment) => <span key={segment.label} className={segment.className} style={{ width: `${total > 0 ? segment.value / total * 100 : 0}%` }} />)}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-600">
              {segments.map((segment) => <span key={segment.label} className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${segment.className}`} />{numberText(segment.value)} {segment.label.toLowerCase()}</span>)}
            </div>
            <p className="mt-3 text-[10px] text-slate-500">{numberText(saleTotal)} with a confirmed sale · {numberText(recruitTotal)} with an approved recruit (overlap shown as “Both”).</p>
          </>
        )}
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-[10px] text-amber-900"><b>Counting rule:</b> a recruit counts only after their Associate Pro upgrade is approved.</div>
      </section>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FOLLOW_UPS.map((item) => {
          const result = data.follow_up[item.key];
          const available = result.available;
          return (
            <article key={item.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700">{item.label}</h3>
              {available ? <div className="mt-2 text-2xl font-bold text-slate-900">{numberText(result.count)}</div> : <div className="mt-2 text-xs font-semibold text-amber-700">No data recorded</div>}
              <p className="mt-1 min-h-8 text-[10px] text-slate-500">{available ? 'People not yet recorded at the next tracked stage.' : 'The next stage is not tracked for the selected cohorts.'}</p>
              <Button variant="link" size="sm" className="h-auto px-0 text-xs text-emerald-800" disabled={!available || result.count === 0} onClick={() => onOpenFollowUp(item.key)}>View people <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function PeopleDialog({
  open,
  onOpenChange,
  selection,
  setSelection,
  filters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: DrillSelection | null;
  setSelection: (selection: DrillSelection | null) => void;
  filters: RecruitmentAnalysisFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('people_page')) || 1;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const people = useRecruitmentAnalysisPeople({
    filters,
    stage: selection?.kind === 'stage' ? selection.value as RecruitmentStage : undefined,
    followUp: selection?.kind === 'follow_up' ? selection.value as RecruitmentFollowUp : undefined,
    page,
    limit: PEOPLE_LIMIT,
    search: debouncedSearch,
  });
  const selectionToken = selection ? `${selection.kind}:${selection.value}` : '';
  const title = selection?.kind === 'stage'
    ? STAGES.find((stage) => stage.key === selection.value)?.label ?? 'People'
    : FOLLOW_UPS.find((item) => item.key === selection?.value)?.label ?? 'Follow-up';
  const cohortName = selection?.cohortId ? people.data?.items[0]?.cohort_name : undefined;

  const updatePeoplePage = (nextPage: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage) params.set('people_page', nextPage);
    else params.delete('people_page');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const changeSelection = (value: string) => {
    const [kind, selectionValue] = value.split(':');
    const next: DrillSelection | null = kind === 'stage' && RecruitmentStageSchema.safeParse(selectionValue).success
      ? { kind: 'stage', value: selectionValue as RecruitmentStage, cohortId: selection?.cohortId }
      : kind === 'follow_up' && RecruitmentFollowUpSchema.safeParse(selectionValue).success
        ? { kind: 'follow_up', value: selectionValue as RecruitmentFollowUp, cohortId: selection?.cohortId }
        : null;
    setSelection(next);
    setSearch('');
    updatePeoplePage(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) setSearch(''); }}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><DialogTitle className="text-lg">{title}</DialogTitle><DialogDescription className="mt-1 text-xs">People counted in this group{cohortName ? ` · ${cohortName}` : ''}. Filters follow the dashboard selection.</DialogDescription></div>
            <Select value={selectionToken} onValueChange={changeSelection}>
              <SelectTrigger className="w-full sm:w-[230px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => <SelectItem key={`stage:${stage.key}`} value={`stage:${stage.key}`}>{stage.label}</SelectItem>)}
                {FOLLOW_UPS.map((item) => <SelectItem key={`follow_up:${item.key}`} value={`follow_up:${item.key}`}>Follow-up: {item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); updatePeoplePage(null); }} placeholder="Search name, email or cohort" aria-label="Search people" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto px-5 sm:px-6">
          {people.isLoading ? <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading people…</div> : people.error ? <p className="py-12 text-center text-sm text-red-600">{people.error.message}</p> : people.data?.items.length ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[690px] border-collapse text-left text-xs"><thead className="sticky top-0 bg-white"><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><th className="py-3 pr-3">Person</th><th className="px-3 py-3">Cohort</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Furthest stage</th><th className="py-3 pl-3">Follow-up</th></tr></thead><tbody>{people.data.items.map((person) => <tr key={person.id} className="border-b border-slate-50 last:border-0"><td className="py-3 pr-3"><b className="text-slate-800">{person.first_name} {person.last_name}</b><span className="mt-1 block text-[10px] text-slate-400">{person.email}</span></td><td className="px-3 py-3 text-slate-600">{person.cohort_name}</td><td className="px-3 py-3 text-slate-600">{person.source ?? 'Unattributed'}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] ${person.classification === 'acquired' ? 'bg-emerald-50 text-emerald-800' : person.classification === 'influenced' ? 'bg-sky-50 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>{person.classification === 'acquired' ? 'New recruit' : person.classification === 'influenced' ? 'Existing user' : 'Unclassified'}</span></td><td className="px-3 py-3 text-slate-600">{STAGES.find((stage) => stage.key === person.furthest_stage)?.label ?? person.furthest_stage}</td><td className="py-3 pl-3 text-slate-500">{person.stalled_days !== null ? `Stalled ${person.stalled_days} days` : '—'}</td></tr>)}</tbody></table></div>
          ) : <div className="py-14 text-center text-sm text-slate-400">No people match this selection.</div>}
        </div>
        <div className="shrink-0 border-t border-slate-100 px-5 sm:px-6">
          <p className="pt-3 text-[10px] text-slate-400">Analysis only. Manage applicants in the existing programme, event, test, and course pages.</p>
          {people.data?.meta.total ? <Pagination count={people.data.meta.total} currentIdx={page} limit={PEOPLE_LIMIT} pageParam="people_page" /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RecruitmentAnalysisPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, preset, programmeId, cohortId, source, update } = useAnalysisFilters();
  const [comparisonTab, setComparisonTab] = useState<ComparisonTab>('programmes');
  const [drillOpen, setDrillOpen] = useState(false);
  const [drill, setDrill] = useState<DrillSelection | null>(null);
  const optionsQuery = useRecruitmentAnalysis(EMPTY_FILTERS);
  const dashboard = useRecruitmentAnalysis(filters);
  const data = dashboard.data;
  const options = optionsQuery.data?.filter_options ?? data?.filter_options;
  const range = dateWindow(preset);
  const dashboardLabel = formatDateRange(range.cohort_started_from, range.cohort_started_to);

  const openStage = (stage: RecruitmentStage, scopedCohortId?: string) => {
    setDrill({ kind: 'stage', value: stage, cohortId: scopedCohortId });
    setDrillOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('people_page', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openFollowUp = (followUp: RecruitmentFollowUp) => {
    setDrill({ kind: 'follow_up', value: followUp });
    setDrillOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('people_page', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const refresh = () => { void dashboard.refetch(); void optionsQuery.refetch(); };
  const closePeople = (open: boolean) => {
    setDrillOpen(open);
    if (!open) {
      setDrill(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('people_page');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-3 pb-16 pt-4 sm:px-5 lg:px-7">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">People &amp; growth</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Recruitment analysis</h1>
          <p className="mt-1 text-sm text-slate-500">See how recruitment moves people from registration to active Associate Pro.</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="text-xs text-slate-500">Last updated <b className="font-semibold text-emerald-800">{data ? formatUpdatedAt(data.generated_at) : '—'}</b></div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={dashboard.isFetching} aria-label="Refresh recruitment analysis">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${dashboard.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </header>

      {options ? <AnalysisFilters preset={preset} programmeId={programmeId} cohortId={cohortId} source={source} options={options} update={update} /> : null}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />Date filters use cohort creation dates ({dashboardLabel}). Untracked stages are shown as “No data recorded,” not as zero.</div>

      {dashboard.isLoading && !data ? (
        <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading recruitment analysis…</div>
      ) : dashboard.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{dashboard.error.message || 'Unable to load recruitment analysis.'}<Button variant="link" className="ml-1 h-auto p-0 text-red-800" onClick={refresh}>Try again</Button></div>
      ) : data ? (
        <>
          <section><CardTitle title="Recruitment summary" aside="Counted once per cohort at each stage" /><SummaryCards data={data} onOpen={openStage} /></section>
          <section><CardTitle title="Recruitment journey" aside="Click a stage or count to inspect people" /><Journey data={data} onOpen={openStage} /></section>
          <section><CardTitle title="Comparison" aside="Filters apply to every comparison" /><Comparison data={data} activeTab={comparisonTab} setActiveTab={setComparisonTab} /></section>
          <section><CardTitle title="Cohort comparison" aside="Acquired and influenced people are kept separate" /><CohortTable data={data} onOpen={openStage} /></section>
          <section><CardTitle title="Associate Pro activity" aside="Activity after upgrade approval" /><ActivityAndFollowUp data={data} onOpenFollowUp={openFollowUp} /></section>
          <details className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-800">Metric definitions and counting rules<ChevronDown className="h-4 w-4 text-slate-400" /></summary>
            <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">
              {STAGES.map((stage) => <li key={stage.key}><b className="text-slate-800">{stage.label}:</b> {stage.definition}</li>)}
              <li>A person is counted once per stage within each cohort. A person can be counted again in another cohort.</li>
              <li>Newly acquired people (`was_existing: false`) and existing users influenced (`was_existing: true`) are shown separately. Unknown legacy classification remains unclassified.</li>
              <li>An upgrade counts only after approval. An active Associate Pro needs a confirmed sale or a recruit whose upgrade is approved after the original upgrade.</li>
              <li>Missing attendance, test, or course tracking is not a measured zero.</li>
            </ul>
          </details>
        </>
      ) : null}

      {drill ? <PeopleDialog open={drillOpen} onOpenChange={closePeople} selection={drill} setSelection={setDrill} filters={{ ...filters, cohort_id: drill.cohortId ?? filters.cohort_id }} /> : null}
    </div>
  );
}

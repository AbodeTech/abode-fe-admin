'use client';

import { useMemo } from 'react';
import { AlertCircle, ArrowUpRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecruitmentAnalysis, RecruitmentStage } from '../schemas/recruitment-analysis.schema';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cohortStage, cohortValue, countText, goalProgress, programmeComparisons, rate, rateText, type AnalysisCohort, type AnalysisMetric } from './analysis-presentation';
import { RecruitmentNeedsAttention } from './RecruitmentNeedsAttention';

type Update = (changes: Record<string, string | null>) => void;
type OpenStage = (stage: RecruitmentStage, cohortId?: string) => void;
const panel = 'rounded-2xl border border-slate-200 bg-white';
const palette = ['#2a78d6', '#eb6834', '#1baf7a', '#8b5cf6', '#64748b'];

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className="flex min-w-[140px] flex-1 flex-col gap-1 sm:max-w-[220px]"><span className="text-[11px] text-slate-500">{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>;
}

export function AnalysisToolbar({ options, programmeId, cohortId, source, stages, stage, metric, update }: {
  options: RecruitmentAnalysis['filter_options']; programmeId?: string; cohortId?: string; source?: string;
  stages: string[]; stage: string; metric: AnalysisMetric; update: Update;
}) {
  const filters = [programmeId, cohortId, source, stage === 'all' ? undefined : stage].filter(Boolean).length;
  return <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 pb-4">
    <FilterSelect label="Programme" value={programmeId ?? 'all'} onChange={value => update({ programme_id: value === 'all' ? null : value, cohort_id: null, cohort_stage: null })}><SelectItem value="all">All programmes</SelectItem>{options.programmes.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</FilterSelect>
    <FilterSelect label="Cohort" value={cohortId ?? 'all'} onChange={value => update({ cohort_id: value === 'all' ? null : value, cohort_stage: null })}><SelectItem value="all">All cohorts</SelectItem>{options.cohorts.filter(item => !programmeId || item.programme_id === programmeId).map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</FilterSelect>
    <FilterSelect label="Source" value={source ?? 'all'} onChange={value => update({ source: value === 'all' ? null : value })}><SelectItem value="all">All sources</SelectItem>{options.sources.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</FilterSelect>
    <FilterSelect label="Cohort stage · table & charts" value={stage} onChange={value => update({ cohort_stage: value === 'all' ? null : value })}><SelectItem value="all">All stages</SelectItem>{Array.from(new Set([...stages, ...(stage === 'all' ? [] : [stage])])).map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</FilterSelect>
    <div className="min-w-0"><span className="mb-1 block text-[11px] text-slate-500">Judge by</span><div role="group" aria-label="Comparison metric" className="flex flex-wrap gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-1">{(['upgrades', 'selling'] as const).map(value => <button key={value} type="button" aria-pressed={metric === value} onClick={() => update({ judge_by: value, cohort_sort: value, cohort_direction: 'desc' })} className={cn('rounded-md px-3 py-1.5 text-xs focus-visible:outline-blue-500', metric === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>{value === 'upgrades' ? 'Became Pro' : 'Pros selling'}</button>)}<button type="button" disabled title="Sales amounts are not available yet" className="cursor-not-allowed px-3 py-1.5 text-xs text-slate-400">₦ per registrant</button></div></div>
    <div className="ml-auto flex h-9 items-center gap-3 text-[11px] text-slate-500"><span>{filters ? `${filters} filters selected` : 'Showing everything'}</span><button type="button" onClick={() => update({ programme_id: null, cohort_id: null, source: null, cohort_stage: null, judge_by: null, cohort_search: null, cohort_sort: null, cohort_direction: null })} className="font-semibold text-blue-600">Reset</button></div>
  </div>;
}

export function BusinessSummary({ data }: { data: RecruitmentAnalysis }) {
  const summary = data.summary;
  const selling = summary.active_associate_pros.count === null ? null : summary.active_associate_pros.confirmed_sale_only + summary.active_associate_pros.both;
  const cards = [
    { label: 'Registrants', value: countText(summary.registrants.count), foot: `across ${data.cohorts.length} cohort${data.cohorts.length === 1 ? '' : 's'}` },
    { label: 'Became Associate Pro', value: countText(summary.approved_upgrades.count), foot: `${rateText(rate(summary.approved_upgrades.count, summary.registrants.count))} of registrants` },
    { label: 'Now selling', value: countText(selling), foot: `${rateText(rate(selling, summary.approved_upgrades.count))} of approved Pros · confirmed sale` },
    { label: 'Sales from recruits', value: '—', foot: 'Sales value not available' },
  ];
  return <section aria-label="Recruitment summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <article key={card.label} className={cn(panel, 'min-h-[118px] p-5')}><h2 className="text-xs font-medium text-slate-600">{card.label}</h2><div className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-slate-900 tabular-nums">{card.value}</div><p className="mt-1 text-[11px] text-slate-500">{card.foot}</p></article>)}</section>;
}

export function AttendanceNotice({ data, onOpen }: { data: RecruitmentAnalysis; onOpen: OpenStage }) {
  if (!data.cohorts.length || (data.summary.attendees.count !== 0 && data.coverage.attendees.missing_segments === 0 && data.summary.attendees.count !== null)) return null;
  const missing = data.summary.attendees.count === null || data.coverage.attendees.missing_segments > 0;
  return <aside className="mb-9 mt-[18px] flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900"><AlertCircle className="h-5 w-5 shrink-0 text-amber-600" /><div className="flex-1"><p className="text-xs font-semibold">{missing ? 'Attendance tracking is incomplete' : '0 attendance check-ins'}</p><p className="mt-1 text-[11px] text-amber-800">Review cohort check-in records.</p></div><Button variant="outline" size="sm" disabled={data.summary.attendees.count === null} onClick={() => onOpen('attendee')} className="border-amber-200 text-xs text-amber-800">Review <ArrowUpRight className="ml-1 h-3 w-3" /></Button></aside>;
}

export function RecruitmentJourney({ data, onOpen }: { data: RecruitmentAnalysis; onOpen: OpenStage }) {
  const labels = new Map(data.journey.map(item => [item.stage, item.label]));
  return <section className="space-y-3"><h2 className="text-sm font-bold text-slate-900">Recruitment journey</h2><div className={cn(panel, 'p-4 sm:p-5')}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Stage conversion</h3><span className="text-[11px] text-slate-400">Bars show share of registrants</span></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.journey.map((item, index) => {
    const share = rate(item.count, data.summary.registrants.count);
    return <button key={item.stage} type="button" disabled={item.count === null} onClick={() => onOpen(item.stage)} title={item.missing_cohorts ? `${item.missing_cohorts} cohorts without tracked data` : undefined} className={cn('flex min-h-[170px] flex-col rounded-xl border p-4 text-left transition focus-visible:outline-blue-500 disabled:cursor-default', index >= 5 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white', item.count !== null && 'hover:border-blue-300 hover:shadow-sm')}><span className="flex items-start justify-between gap-2"><span className="flex items-start gap-2 text-xs font-semibold text-slate-600"><i className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] not-italic text-blue-600">{index + 1}</i>{item.label}</span><span className="rounded bg-blue-50 px-1.5 py-1 text-[10px] font-semibold text-blue-600">{rateText(share)}</span></span><strong className={cn('mb-2 mt-5 block tabular-nums', item.count === null ? 'text-base text-amber-700' : 'text-[28px] leading-none tracking-tight text-slate-900')}>{item.count === null ? 'Not tracked' : countText(item.count)}</strong><span className="mb-3 text-[10px] text-slate-500">{item.count === null ? 'No data recorded' : item.denominator_stage ? `${rateText(item.conversion_rate)} of ${labels.get(item.denominator_stage)?.toLowerCase() ?? 'previous stage'}` : 'Starting stage'}{item.missing_cohorts > 0 && item.count !== null ? ' · Partial data' : ''}</span><span className="mt-auto block h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, share ?? 0))}%` }} /></span></button>;
  })}</div>{!data.journey.length && <p className="py-8 text-center text-sm text-slate-400">No journey data for this selection.</p>}</div></section>;
}

const columns = [
  ['name', 'Cohort'], ['programme', 'Programme'], ['started', 'Started'], ['stage', 'Stage'], ['registrants', 'Registrants'], ['upgrades', 'Became Pro'], ['selling', 'Pros selling'], ['sales', '₦ / registrant'], ['comparison', 'vs programme'],
] as const;
export type CohortSort = typeof columns[number][0];

export function CohortExplorer({ data, stage, metric, search, sort, direction, page, update, onOpenCohort }: {
  data: RecruitmentAnalysis; stage: string; metric: AnalysisMetric; search: string; sort: CohortSort; direction: 'asc' | 'desc'; page: number; update: Update; onOpenCohort: (cohortId: string) => void;
}) {
  const cohorts = useMemo(() => data.cohorts.filter(cohort => stage === 'all' || cohortStage(cohort) === stage), [data.cohorts, stage]);
  const comparisons = useMemo(() => programmeComparisons(cohorts, metric), [cohorts, metric]);
  const programmeColors = new Map(Array.from(new Set(data.cohorts.map(cohort => cohort.programme_id))).sort().map((id, index) => [id, palette[index % palette.length]]));
  const rows = cohorts.filter(cohort => `${cohort.name} ${cohort.programme_name}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => {
    const get = (cohort: AnalysisCohort): string | number | null => {
      switch (sort) {
        case 'name': return cohort.name;
        case 'programme': return cohort.programme_name;
        case 'started': return Number.isFinite(Date.parse(cohort.created_at)) ? Date.parse(cohort.created_at) : null;
        case 'stage': return cohortStage(cohort);
        case 'registrants': return cohort.registrants.count;
        case 'upgrades': case 'selling': return cohortValue(cohort, sort);
        case 'comparison': return comparisons.get(cohort.id) ?? null;
        default: return null;
      }
    };
    const av = get(a), bv = get(b);
    if (av === null) return bv === null ? a.name.localeCompare(b.name) : 1;
    if (bv === null) return -1;
    return (direction === 'asc' ? 1 : -1) * (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))) || a.name.localeCompare(b.name);
  });
  const limit = 12;
  const pages = Math.max(1, Math.ceil(rows.length / limit));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * limit, currentPage * limit);
  const chartRows = cohorts.filter(cohort => goalProgress(cohort) !== null).sort((a, b) => (goalProgress(b) ?? 0) - (goalProgress(a) ?? 0));
  const scatterRows = chartRows.filter(cohort => cohort.registrants.count !== null);
  const maxX = Math.max(1, ...scatterRows.map(cohort => cohort.registrants.count ?? 0));
  const maxY = Math.max(100, ...scatterRows.map(cohort => goalProgress(cohort) ?? 0));
  const metricLabel = metric === 'upgrades' ? 'Became Pro' : 'Pros selling';
  return <>
    <section aria-label="Cohort charts" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article className={cn(panel, 'p-5')}><h2 className="text-sm font-bold">Goal progress by cohort</h2><p className="mt-1 text-[11px] text-slate-500">Registration goal reached{chartRows.length > 8 ? ' · Top 8 cohorts' : ''}</p><div className="mt-6 space-y-5">{chartRows.slice(0, 8).map(cohort => <div key={cohort.id} className="grid grid-cols-[minmax(100px,1fr)_minmax(60px,1fr)_48px] items-center gap-3"><div className="min-w-0"><button type="button" aria-haspopup="dialog" onClick={() => onOpenCohort(cohort.id)} title={cohort.name} className="block w-full truncate text-left text-xs font-semibold text-slate-800 hover:text-blue-600 focus-visible:outline-blue-500">{cohort.name}</button><p className="mt-1 text-[10px] text-slate-400">{countText(cohort.registrants.count)} registrants</p></div><div className="h-2 rounded bg-slate-100"><div className="h-full rounded bg-blue-500" style={{ width: `${Math.min(100, goalProgress(cohort) ?? 0)}%` }} /></div><span className="text-right text-xs font-semibold">{rateText(goalProgress(cohort))}</span></div>)}{!chartRows.length && <p className="py-10 text-center text-sm text-slate-400">No registration goals recorded.</p>}</div></article>
      <article className={cn(panel, 'p-5')}><h2 className="text-sm font-bold">Cohort volume vs. goal progress</h2><p className="mt-1 text-[11px] text-slate-500">Each dot represents a cohort</p>{scatterRows.length ? <svg viewBox="0 0 500 270" role="group" aria-label="Cohort registrants against percentage of registration goal reached. Values are also available in the cohort table and goal chart." className="mt-3 w-full"><text x="54" y="14" fontSize="10" fill="#64748b">Goal progress</text>{[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1="54" y1={220 - tick * 46} x2="465" y2={220 - tick * 46} stroke="#e2e8f0" strokeDasharray="3 4" /><text x="47" y={224 - tick * 46} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(maxY * tick / 4)}%</text><text x={54 + tick * 102.75} y="241" textAnchor="middle" fontSize="10" fill="#94a3b8">{Math.round(maxX * tick / 4).toLocaleString()}</text></g>)}{scatterRows.map(cohort => <circle key={cohort.id} role="button" tabIndex={0} aria-label={`View ${cohort.name} details`} aria-haspopup="dialog" className="cursor-pointer focus:stroke-blue-900 focus:stroke-[3px]" onClick={() => onOpenCohort(cohort.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenCohort(cohort.id); } }} cx={54 + (cohort.registrants.count ?? 0) / maxX * 411} cy={220 - (goalProgress(cohort) ?? 0) / maxY * 184} r="5" fill={programmeColors.get(cohort.programme_id)} stroke="white" strokeWidth="1.5"><title>{cohort.name}: {countText(cohort.registrants.count)} registrants, {rateText(goalProgress(cohort))} goal progress</title></circle>)}<text x="260" y="263" textAnchor="middle" fontSize="10" fill="#64748b">Registrants</text></svg> : <p className="py-14 text-center text-sm text-slate-400">No cohort goals available to compare.</p>}</article>
    </section>
    <RecruitmentNeedsAttention cohorts={cohorts} metric={metric} onOpenCohort={onOpenCohort} />
    <section className={cn(panel, 'overflow-hidden p-4 sm:p-5')} aria-labelledby="all-cohorts-title"><div className="mb-4"><h2 id="all-cohorts-title" className="text-sm font-bold">All cohorts</h2><p className="mt-1 text-xs text-slate-500">“vs programme” compares {metricLabel} with the median of the same programme.</p></div>
      <div className="relative mb-4 max-w-[360px]"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Search cohorts or programmes" placeholder="Search cohorts…" value={search} onChange={event => update({ cohort_search: event.target.value || null })} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-blue-500" /></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1060px] text-left text-xs"><thead><tr className="border-b border-slate-200 text-[11px] text-slate-500">{columns.map(([key, label], index) => <th key={key} scope="col" aria-sort={sort === key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'} className={cn('px-3 py-3 font-medium', index >= 4 && 'text-right', key === metric && 'bg-blue-50/60')}><button type="button" disabled={key === 'sales'} title={key === 'sales' ? 'Sales amounts are not available yet' : undefined} onClick={() => update({ cohort_sort: key, cohort_direction: sort === key && direction === 'desc' ? 'asc' : 'desc' })} className="whitespace-nowrap focus-visible:outline-blue-500 disabled:cursor-default">{label}{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</button></th>)}</tr></thead><tbody>{visible.map(cohort => {
        const comparison = comparisons.get(cohort.id) ?? null;
        const date = new Date(cohort.created_at);
        return <tr key={cohort.id} onClick={() => onOpenCohort(cohort.id)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="px-3 py-4"><button type="button" aria-haspopup="dialog" className="text-left font-bold text-slate-800 hover:text-blue-600 focus-visible:outline-blue-500">{cohort.name}</button></td><td className="whitespace-nowrap px-3 py-4"><i className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: programmeColors.get(cohort.programme_id) }} />{cohort.programme_name}</td><td className="whitespace-nowrap px-3 py-4" title="Cohort creation date">{Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Africa/Lagos' }) : '—'}</td><td className="px-3 py-4"><span className={cn('whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold', cohort.status === 'registration_open' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>{cohortStage(cohort)}</span></td><td className="px-3 py-4 text-right tabular-nums">{countText(cohort.registrants.count)}</td>{(['upgrades', 'selling'] as const).map(value => <td key={value} className={cn('px-3 py-4 text-right tabular-nums', value === metric && 'bg-blue-50/60')}>{rateText(cohortValue(cohort, value))}</td>)}<td className="px-3 py-4 text-right text-slate-400" title="Sales amounts are not available yet">—</td><td className="px-3 py-4 text-right tabular-nums"><span title={comparison === null ? 'Requires a nonzero programme median and tracked outcomes' : undefined} className={cn('text-[11px] font-semibold', comparison === null ? 'text-slate-400' : comparison >= 0 ? 'text-emerald-600' : 'text-red-600')}>{comparison === null ? '—' : `${comparison >= 0 ? '▲' : '▼'} ${rateText(Math.abs(comparison))}`}</span></td></tr>;
      })}{!visible.length && <tr><td colSpan={9} className="py-12 text-center text-slate-400">No cohorts match this selection.</td></tr>}</tbody></table></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500"><span aria-live="polite">{rows.length ? `${(currentPage - 1) * limit + 1}–${Math.min(currentPage * limit, rows.length)} of ${rows.length} cohorts` : '0 cohorts'}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => update({ cohort_page: String(currentPage - 1) })}>Previous</Button><Button variant="outline" size="sm" disabled={currentPage >= pages} onClick={() => update({ cohort_page: String(currentPage + 1) })}>Next</Button></div></div>
    </section>
  </>;
}

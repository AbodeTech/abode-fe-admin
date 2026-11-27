'use client';

import { AlertCircle, ArrowUpRight, ChartNoAxesColumn, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';
import { cohortStage, cohortValue, proCount, countText, rate, rateText, recruitmentAttention, sellingCount, type AnalysisCohort } from './analysis-presentation';
import s from './recruitment-analytics.module.css';
import { AnalyticsSelect } from './AnalyticsSelect';
import { costNote, moneyText, minorText, compactMinorText, multipleText, performanceTotals } from './analytics-performance';
import { ReturnChart } from './RecruitmentAnalyticsCharts';

export type AnalyticsUpdate = (changes: Record<string, string | null>) => void;
export const cohortDate = (value: string) => Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' }) : '—';

export function Unavailable({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className={s.empty}><ChartNoAxesColumn size={28} strokeWidth={1.3} aria-hidden /><strong>{title}</strong><p>{children}</p></div>;
}

export function Stat({ label, value, foot, valueTitle }: { label: string; value: string; foot: string; valueTitle?: string }) {
  return <div className={s.stat}><span>{label}</span><strong title={valueTitle}>{value}</strong><small className={s.muted}>{foot}</small></div>;
}

export function Status({ cohort }: { cohort: AnalysisCohort }) {
  return <span className={cn(s.badge, cohort.status === 'registration_open' && s.amber)}>{cohortStage(cohort)}</span>;
}

export function AnalyticsFilters({ options, programmeId, source, status, update }: {
  options: RecruitmentAnalysis['filter_options']; programmeId?: string; source?: string; status: string; update: AnalyticsUpdate;
}) {
  return <div className={s.filterBar}>
    <div className={s.filterFields}>
      <AnalyticsSelect label="Programme" value={programmeId ?? ''} onChange={value => update({ programme_id: value, cohort_id: null })} options={[{ value: '', label: 'All programmes' }, ...options.programmes.map(p => ({ value: p.id, label: p.name }))]} />
      <AnalyticsSelect label="Source" value={source ?? ''} onChange={value => update({ source: value })} options={[{ value: '', label: 'All sources' }, ...options.sources.map(p => ({ value: p.value, label: p.label }))]} />
      <AnalyticsSelect label="Registration status" value={status} onChange={value => update({ status: value })} options={[{ value: 'all', label: 'All statuses' }, { value: 'registration_open', label: 'Open' }, { value: 'registration_closed', label: 'Closed' }]} />
    </div>
    {(programmeId || source || status !== 'all') && <button className={s.resetFilters} onClick={() => update({ programme_id: null, cohort_id: null, source: null, status: null, cohort_search: null })}>Reset filters</button>}
  </div>;
}

// Never report an incomplete total as if every cohort were tracked.
export const completeTotal = (values: (number | null)[]) => values.some(v => v === null) ? null : values.reduce<number>((sum, v) => sum + (v ?? 0), 0);

export function RecruitmentAnalyticsOverview({ data, status, search, sort, page, selected, update, onSelect, onCompare, onOpen }: {
  data: RecruitmentAnalysis; status: string; search: string; sort: string; page: number; selected: string[];
  update: AnalyticsUpdate; onSelect: (id: string) => void; onCompare: () => void; onOpen: (id: string) => void;
}) {
  const cohorts = data.cohorts.filter(c => status === 'all' || c.status === status);
  const registrants = completeTotal(cohorts.map(c => c.registrants.count));
  const upgrades = completeTotal(cohorts.map(proCount));
  const selling = completeTotal(cohorts.map(sellingCount));
  const totals = performanceTotals(cohorts);
  const sortValue = (c: AnalysisCohort) => sort === 'sales' ? c.performance?.contract_value.amount_minor ?? null : sort === 'return' ? c.performance?.cost.availability === 'tracked' ? c.performance.cost.return_on_revenue : null : sort === 'registrants' ? c.registrants.count : sort === 'upgrades' ? cohortValue(c, 'upgrades') : Date.parse(c.created_at);
  const attention = recruitmentAttention(cohorts, 'upgrades');
  const rows = cohorts.filter(c => `${c.name} ${c.programme_name}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const av = sortValue(a);
    const bv = sortValue(b);
    if (av === null || !Number.isFinite(av)) return bv === null || !Number.isFinite(bv) ? a.name.localeCompare(b.name) : 1;
    if (bv === null || !Number.isFinite(bv)) return -1;
    return (sort === 'upgrades' ? av - bv : bv - av) || a.name.localeCompare(b.name);
  });
  const pages = Math.max(1, Math.ceil(rows.length / 8));
  const current = Math.min(pages, page);
  const visible = rows.slice((current - 1) * 8, current * 8);
  return <>
    <section className={s.summary} aria-label="Cohort totals">
      <Stat label="Cohorts" value={countText(cohorts.length)} foot={`${cohorts.filter(c => c.status === 'registration_open').length} open for registration`} />
      <Stat label="Registrants" value={countText(registrants)} foot={registrants === null ? 'Tracking incomplete' : 'across selected cohorts'} />
      <Stat label="Became Associate Pro" value={countText(upgrades)} foot={`${rateText(rate(upgrades, registrants))} of registrants · credited once`} />
      <Stat label="Pros selling" value={countText(selling)} foot={`${rateText(rate(selling, upgrades))} of credited Pros`} />
      <Stat label="Sales value" value={totals.sales === null ? '—' : compactMinorText(totals.sales)} valueTitle={totals.sales === null ? undefined : minorText(totals.sales)} foot={totals.revenue === null ? 'Money paid unavailable' : `${minorText(totals.revenue)} paid to date`} />
      <Stat label="Revenue" value={totals.revenue === null ? '—' : minorText(totals.revenue)} foot={totals.returnOnRevenue === null ? totals.costNote : `${multipleText(totals.returnOnRevenue)} the recorded cost`} />
    </section>
    <section className={s.split} aria-label="Returns and attention">
      <article className={s.panel}><div className={s.panelHead}><div><h2>Return by cohort</h2><p className={s.muted}>Money paid per ₦1 of recorded cost</p></div></div><ReturnChart cohorts={cohorts} onOpen={onOpen} /></article>
      <article className={cn(s.panel, s.attention)}><div className={s.panelHead}><h2>Needs attention</h2><span className={cn(s.badge, s.amber)}>{attention.rows.length} cohorts</span></div>
        {attention.rows.slice(0, 3).map(item => <button key={item.cohort.id} onClick={() => onOpen(item.cohort.id)}><AlertCircle size={17} /><div><strong>{item.cohort.name}</strong><p className={s.muted}>{rateText(item.value)} became Pro vs {rateText(item.baseline)} for closed cohorts in this programme · about {countText(Math.ceil(item.peopleGap))} Pros short</p></div><ArrowUpRight size={16} /></button>)}
        {!attention.rows.length && <div className={s.empty}><strong>{attention.comparableCohorts ? 'No cohorts flagged' : 'Not enough comparable results'}</strong><p>{attention.comparableCohorts ? 'No closed cohorts are 15% below their programme median.' : 'At least two closed cohorts with tracked upgrades are needed per programme.'}</p></div>}
        {attention.rows.length > 0 && <p className={cn(s.muted, s.padding)}>Closed cohorts at least 15% below their programme median. Registration goals are assessed separately.</p>}
      </article>
    </section>
    <section className={s.panel} aria-label="All cohorts">
      <div className={s.panelHead}><div><h2>All cohorts</h2><p className={s.muted}>{rows.length} cohorts</p></div><div className={s.filters}><label className={s.field}><span className="sr-only">Search cohorts</span><span className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className={s.search} style={{ paddingLeft: 36 }} value={search} onChange={e => update({ cohort_search: e.target.value })} placeholder="Search cohorts" /></span></label><AnalyticsSelect label="Sort by" value={sort} onChange={value => update({ cohort_sort: value })} options={[{ value: "newest", label: "Newest created" }, { value: "registrants", label: "Most registrants" }, { value: "upgrades", label: "Lowest Pro rate" }, { value: "sales", label: "Highest sales value" }, { value: "return", label: "Highest return" }]} /></div></div>
      <div className={s.selection}><strong>{selected.length ? `${selected.length} cohort${selected.length === 1 ? '' : 's'} selected` : 'Select up to 4 cohorts to compare'}</strong><span className={s.muted}>{selected.length === 1 ? 'Choose one more to compare.' : selected.length === 4 ? 'Comparison limit reached.' : ''}</span><button className={s.primary} disabled={selected.length < 2} onClick={onCompare}>Compare selected</button>{selected.length > 0 && <button className={s.link} onClick={() => update({ compare: null })}>Clear</button>}</div>
      <div className={s.tableWrap}><table className={s.table} style={{ minWidth: 1080 }}><thead><tr><th><span className="sr-only">Select to compare</span></th><th className={s.left}>Cohort</th><th className={s.left}>Created</th><th className={s.left}>Registration status</th><th>Registrants</th><th>Became Pro</th><th>Pros selling</th><th>Sales value</th><th>Cost</th><th>Return</th></tr></thead><tbody>
        {visible.map(c => <tr key={c.id}><td><input type="checkbox" aria-label={`Compare ${c.name}`} checked={selected.includes(c.id)} disabled={!selected.includes(c.id) && selected.length >= 4} onChange={() => onSelect(c.id)} /></td><th scope="row" className={s.left} style={{ background: 'transparent' }}><button className={s.name} onClick={() => onOpen(c.id)}>{c.name}</button><span className={cn(s.muted, 'block')}>{c.programme_name}</span></th><td className={cn(s.left, 'whitespace-nowrap')}>{cohortDate(c.created_at)}</td><td className={s.left}><Status cohort={c} /></td><td>{countText(c.registrants.count)}</td><td>{rateText(cohortValue(c, 'upgrades'))}</td><td>{rateText(cohortValue(c, 'selling'))}</td><td>{moneyText(c.performance?.contract_value)}</td><td title={costNote(c.performance?.cost)}>{moneyText(c.performance?.cost.availability === 'tracked' ? c.performance.cost.total : null)}</td><td title={costNote(c.performance?.cost)}>{multipleText(c.performance?.cost.availability === 'tracked' ? c.performance.cost.return_on_revenue : null)}</td></tr>)}
        {!visible.length && <tr><td colSpan={10}><div className={s.empty}><strong>No cohorts match your filters</strong><p>Try another programme or clear the search.</p></div></td></tr>}
      </tbody></table></div>
      <div className={s.footer}><span>{rows.length ? `Showing ${(current - 1) * 8 + 1}–${Math.min(current * 8, rows.length)} of ${rows.length} cohorts` : '0 cohorts'}</span><div className={s.chips}><button className={s.button} disabled={current <= 1} onClick={() => update({ cohort_page: String(current - 1) })}>Previous</button><span>Page {current} of {pages}</span><button className={s.button} disabled={current >= pages} onClick={() => update({ cohort_page: String(current + 1) })}>Next</button></div></div>
    </section>
  </>;
}

'use client';

import { Fragment } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysisComparison } from '../hooks/use-recruitment';
import { countText, rate, rateText } from './analysis-presentation';
import { cohortDate, Unavailable } from './RecruitmentAnalyticsOverview';
import s from './recruitment-analytics.module.css';

const summaryRate = (data: RecruitmentAnalysis, key: keyof RecruitmentAnalysis['summary']) => rate(data.summary[key].count, data.summary.registrants.count);
type Measure = { label: string; value?: (data: RecruitmentAnalysis) => number | null; percent?: boolean; highlight?: boolean };
const groups: { label: string; rows: Measure[] }[] = [
  { label: 'The programme', rows: [
    { label: 'Registrants', value: d => d.summary.registrants.count },
    { label: 'Attended', value: d => summaryRate(d, 'attendees'), percent: true, highlight: true },
    { label: 'Took the test', value: d => summaryRate(d, 'test_participants'), percent: true, highlight: true },
    { label: 'Passed', value: d => summaryRate(d, 'test_passes'), percent: true, highlight: true },
    { label: 'Course completions', value: d => summaryRate(d, 'course_completions'), percent: true, highlight: true },
    { label: 'Became Associate Pro', value: d => summaryRate(d, 'approved_upgrades'), percent: true, highlight: true },
  ] },
  { label: 'After becoming a Pro', rows: [
    { label: 'Pros selling', value: d => d.summary.active_associate_pros.count === null ? null : rate(d.summary.active_associate_pros.confirmed_sale_only + d.summary.active_associate_pros.both, d.summary.approved_upgrades.count), percent: true, highlight: true },
    { label: 'Days to first sale' }, { label: 'Sales brought in' }, { label: 'Sales per selling Pro' }, { label: 'Pros they brought in' },
  ] },
  { label: 'Cost and return', rows: [ { label: 'Cohort cost' }, { label: 'Cost per Associate Pro' }, { label: 'Cost per selling Pro' }, { label: 'Sales per ₦1 spent' } ] },
  { label: 'Meetings & activities · share of Pros who took part', rows: [ { label: 'Weekly meeting, at least one' }, { label: 'Allocation event' }, { label: 'Recruited at least one person' }, { label: 'Site inspection' }, { label: 'Sales marathon' } ] },
];

export function RecruitmentAnalyticsCompare({ options, selected, source, onChange, onOpen }: {
  options: RecruitmentAnalysis['filter_options']['cohorts']; selected: string[]; source?: string;
  onChange: (ids: string[]) => void; onOpen: (id: string) => void;
}) {
  const queries = useRecruitmentAnalysisComparison(selected.length >= 2 ? selected : [], source);
  const data = queries.map((q, index) => !q.error && q.data?.cohorts.some(c => c.id === selected[index]) ? q.data : undefined);
  const names = selected.map(id => options.find(c => c.id === id)?.name ?? 'Selected cohort');
  const available = options.filter(c => !selected.includes(c.id));
  return <>
    <header className={s.heading}><div><h1>Compare cohorts</h1><p className={s.subtitle}>Up to four cohorts, measure by measure. The strongest available rate in each row is marked.</p></div>{source && <span className={s.badge}>Source: {source}</span>}</header>
    <div className={s.chips}>{selected.map((id, i) => <span className={s.chip} key={id}>{names[i]}<button aria-label={`Remove ${names[i]}`} onClick={() => onChange(selected.filter(item => item !== id))}><X size={16} /></button></span>)}<label className={s.field}><span className="sr-only">Add a cohort</span><select aria-label="Add a cohort" value="" disabled={selected.length >= 4 || !available.length} onChange={e => e.target.value && onChange([...selected, e.target.value])}><option value="">+ Add cohort</option>{available.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><span className={s.muted}>{selected.length} of 4</span></div>
    {selected.length < 2 ? <section className={cn(s.panel, s.padding)}><Unavailable title={selected.length ? 'Add one more cohort to compare' : 'Choose cohorts to compare'}>{selected.length ? `You’ve picked ${names[0]}. Choose what to put next to it, or open it by itself.` : 'Choose two to four cohorts to see their results side by side.'}</Unavailable><div className={cn(s.chips, 'justify-center pb-5')}>{available.map(c => <button className={s.button} key={c.id} onClick={() => onChange([...selected, c.id])}>{c.name}<ArrowRight size={14} /></button>)}</div>{selected.length === 1 && <div className="pb-4 text-center"><button className={s.link} onClick={() => onOpen(selected[0])}>Open {names[0]} by itself →</button></div>}</section> : <>
      <section className={s.panel}><div className={s.tableWrap}><table className={cn(s.table, s.comparison)} style={{ minWidth: 210 + selected.length * 215 }}><thead><tr><th scope="col">Measure</th>{selected.map((id, i) => { const cohort = data[i]?.cohorts.find(c => c.id === id); return <th scope="col" key={id}><strong>{names[i]}</strong><p className={s.muted}>{cohort ? `${cohort.programme_name} · Created ${cohortDate(cohort.created_at)}` : queries[i]?.isLoading ? 'Loading cohort…' : 'Data unavailable'}</p><button className={cn(s.link, 'mt-2')} onClick={() => onOpen(id)}>Open cohort →</button>{queries[i]?.error && <p role="alert" className="mt-2 text-red-600"><button className={s.link} onClick={() => void queries[i].refetch()}>Retry loading</button></p>}</th>; })}</tr></thead><tbody>
        {groups.map(group => <Fragment key={group.label}><tr className={s.group}><th colSpan={selected.length + 1} scope="colgroup">{group.label}</th></tr>{group.rows.map(row => {
          const values = data.map(d => d && row.value ? row.value(d) : null);
          const known = values.filter((v): v is number => v !== null);
          const best = known.length === selected.length && new Set(known).size > 1 ? Math.max(...known) : null;
          return <tr key={row.label}><th scope="row" className={s.left} style={{ background: 'white', color: '#334155' }}>{row.label}</th>{values.map((value, i) => <td key={selected[i]} className={row.highlight && best !== null && value === best ? s.best : undefined}>{value === null ? <span className={s.muted}>{row.value ? queries[i]?.isLoading ? 'Loading…' : '—' : 'Not available'}</span> : row.percent ? rateText(value) : countText(value)}{row.highlight && best !== null && value === best && <small>Best</small>}</td>)}</tr>;
        })}</Fragment>)}
      </tbody></table></div><p className={cn(s.muted, s.padding)}>Rates use each cohort’s registrants, except Pros selling, which uses approved Pros. Missing results are not treated as zero.</p></section>
      <section className={s.split}><article className={s.panel}><div className={s.panelHead}><div><h2>How quickly Pros made their first sale</h2><p className={s.muted}>Share of Pros with a sale, by days since approval.</p></div></div><Unavailable title="First-sale timelines are not available">Approval dates and first-sale dates are needed to compare cohorts from day zero.</Unavailable></article><article className={cn(s.panel, s.padding)}><h2>What stands out</h2><div className={s.list}>{(() => {
        const values = data.map((d, i) => ({ name: names[i], value: d ? summaryRate(d, 'approved_upgrades') : null }));
        if (values.some(v => v.value === null)) return <p className={s.muted}>Complete upgrade results are needed for a fair comparison.</p>;
        const ordered = values.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        const winners = ordered.filter(v => v.value === ordered[0].value);
        return <p className={s.subtitle}><strong>{winners.map(v => v.name).join(' and ')}</strong> {winners.length === 1 ? 'has' : 'have'} the {winners.length === ordered.length ? 'same' : 'highest'} Pro conversion rate: <strong>{rateText(ordered[0].value)}</strong>.</p>;
      })()}<p className={s.muted}>Cost, sales and activity comparisons will appear when those results are available. Cohort maturity is not supplied yet.</p></div></article></section>
    </>}
  </>;
}

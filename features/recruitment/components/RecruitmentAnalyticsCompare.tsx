'use client';

import { Fragment } from 'react';
import { ArrowRight, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysisComparison } from '../hooks/use-recruitment';
import { countText, rate, rateText } from './analysis-presentation';
import { cohortDate, Unavailable } from './RecruitmentAnalyticsOverview';
import s from './recruitment-analytics.module.css';
import { AnalyticsSelect } from './AnalyticsSelect';
import { activityApplies, activityShare, cohortPerformance, minorText, multipleText } from './analytics-performance';
import { FirstSaleChart } from './RecruitmentAnalyticsCharts';

const summaryRate = (data: RecruitmentAnalysis, key: keyof RecruitmentAnalysis['summary']) => rate(data.summary[key].count, data.summary.registrants.count);
const firstSale90 = (data: RecruitmentAnalysis) => data.first_sale_timeline?.points.find(point => point.day === 90 && point.eligible > 0);

type Measure = { label: string; description?: string; explanation?: string; detail?: (data: RecruitmentAnalysis) => string; unavailable?: (data: RecruitmentAnalysis) => string; bestLabel?: string; applies?: (data: RecruitmentAnalysis) => boolean; value?: (data: RecruitmentAnalysis) => number | null; percent?: boolean; highlight?: boolean; money?: boolean; multiple?: boolean; lower?: boolean };
const groups: { label: string; rows: Measure[] }[] = [
  { label: 'The programme', rows: [
    { label: 'Registrants', value: d => d.summary.registrants.count },
    { label: 'Attended', value: d => summaryRate(d, 'attendees'), percent: true, highlight: true },
    { label: 'Took the test', value: d => summaryRate(d, 'test_participants'), percent: true, highlight: true },
    { label: 'Passed', value: d => summaryRate(d, 'test_passes'), percent: true, highlight: true },
    { label: 'Course completions', value: d => summaryRate(d, 'course_completions'), percent: true, highlight: true },
    { label: 'Became Associate Pro', value: d => rate(cohortPerformance(d)?.credited_pros ?? null, d.summary.registrants.count), percent: true, highlight: true },
  ] },
  { label: 'After becoming a Pro · credited once', rows: [
    { label: 'Credited Pros', value: d => cohortPerformance(d)?.credited_pros ?? null },
    { label: 'Pros selling', value: d => rate(cohortPerformance(d)?.selling_pros ?? null, cohortPerformance(d)?.credited_pros ?? null), percent: true, highlight: true },
    { label: 'Sold within 90 days', description: 'Of Pros approved at least 90 days ago', explanation: 'Among Pros who have had a full 90 days since Associate Pro approval, this shows how many made their first sale within those 90 days. Pros who have not sold are included; newer Pros are excluded.', bestLabel: 'Higher rate', value: d => firstSale90(d)?.percent ?? null, detail: d => { const point = firstSale90(d); return point ? `${countText(point.sellers)} of ${countText(point.eligible)} Pros` : ''; }, unavailable: d => d.first_sale_timeline ? 'Not enough time yet' : 'Data unavailable', percent: true, highlight: true },
    { label: 'Plans sold', value: d => cohortPerformance(d)?.plans_sold ?? null },
    { label: 'Sales value', value: d => cohortPerformance(d)?.contract_value.amount_minor ?? null, money: true },
    { label: 'Money paid', value: d => cohortPerformance(d)?.revenue.amount_minor ?? null, money: true },
    { label: 'Sales value per selling Pro', value: d => cohortPerformance(d)?.contract_value_per_selling_pro?.amount_minor ?? null, money: true },
    { label: 'Pros they brought in', value: d => cohortPerformance(d)?.approved_recruits ?? null },
  ] },
  { label: 'Cost and return', rows: [
    { label: 'Cohort cost', value: d => { const c = cohortPerformance(d)?.cost; return c?.availability === 'tracked' ? c.total.amount_minor : null; }, money: true },
    { label: 'Cost per Associate Pro', value: d => { const c = cohortPerformance(d)?.cost; return c?.availability === 'tracked' ? c.cost_per_pro?.amount_minor ?? null : null; }, money: true, highlight: true, lower: true },
    { label: 'Cost per selling Pro', value: d => { const c = cohortPerformance(d)?.cost; return c?.availability === 'tracked' ? c.cost_per_selling_pro?.amount_minor ?? null : null; }, money: true, highlight: true, lower: true },
    { label: 'Money paid per ₦1 spent', value: d => { const c = cohortPerformance(d)?.cost; return c?.availability === 'tracked' ? c.return_on_revenue : null; }, multiple: true, highlight: true },
    { label: 'Sales value per ₦1 spent', value: d => { const c = cohortPerformance(d)?.cost; return c?.availability === 'tracked' ? c.return_on_contract_value : null; }, multiple: true },
  ] },
  { label: 'Activities · participation among Pros with known activity history', rows: [
    { label: 'Weekly meeting, at least one', value: d => activityShare(d, 'weekly_meeting_any'), percent: true },
    { label: 'Three weekly meetings in 30 days', value: d => activityShare(d, 'weekly_meetings_three_in_30_days'), percent: true },
    { label: 'Allocation event', applies: d => activityApplies(d, 'allocation_event'), value: d => activityShare(d, 'allocation_event'), percent: true },
    { label: 'Recruited at least one person', value: d => activityShare(d, 'recruited_person'), percent: true },
    { label: 'Site inspection', applies: d => activityApplies(d, 'site_inspection'), value: d => activityShare(d, 'site_inspection'), percent: true },
    { label: 'Sales marathon', value: d => activityShare(d, 'sales_marathon'), percent: true },
  ] },
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
    <header className={s.heading}><div><h1>Compare cohorts</h1><p className={s.subtitle}>Compare recruitment, sales and costs across up to four cohorts.</p></div>{source && <span className={s.badge}>Source: {source}</span>}</header>
    <div className={s.chips}>{selected.map((id, i) => <span className={s.chip} key={id}>{names[i]}<button aria-label={`Remove ${names[i]}`} onClick={() => onChange(selected.filter(item => item !== id))}><X size={16} /></button></span>)}<AnalyticsSelect label="Add a cohort" hideLabel value="" disabled={selected.length >= 4 || !available.length} onChange={value => { if (value) onChange([...selected, value]); }} options={[{ value: "", label: "+ Add cohort", disabled: true }, ...available.map(c => ({ value: c.id, label: c.name }))]} /><span className={s.muted}>{selected.length} of 4</span></div>
    {selected.length < 2 ? <section className={cn(s.panel, s.padding)}><Unavailable title={selected.length ? 'Add one more cohort to compare' : 'Choose cohorts to compare'}>{selected.length ? `You’ve picked ${names[0]}. Choose what to put next to it, or open it by itself.` : 'Choose two to four cohorts to see their results side by side.'}</Unavailable><div className={cn(s.chips, 'justify-center pb-5')}>{available.map(c => <button className={s.button} key={c.id} onClick={() => onChange([...selected, c.id])}>{c.name}<ArrowRight size={14} /></button>)}</div>{selected.length === 1 && <div className="pb-4 text-center"><button className={s.link} onClick={() => onOpen(selected[0])}>Open {names[0]} by itself →</button></div>}</section> : <>
      <section className={s.panel}><div className={s.tableWrap}><table className={cn(s.table, s.comparison)} style={{ minWidth: 210 + selected.length * 215 }}><thead><tr><th scope="col">Measure</th>{selected.map((id, i) => { const cohort = data[i]?.cohorts.find(c => c.id === id); return <th scope="col" key={id}><strong>{names[i]}</strong><p className={s.muted}>{cohort ? `${cohort.programme_name} · Created ${cohortDate(cohort.created_at)}` : queries[i]?.isLoading ? 'Loading cohort…' : 'Data unavailable'}</p><button className={cn(s.link, 'mt-2')} onClick={() => onOpen(id)}>Open cohort →</button>{queries[i]?.error && <p role="alert" className="mt-2 text-red-600"><button className={s.link} onClick={() => void queries[i].refetch()}>Retry loading</button></p>}</th>; })}</tr></thead><tbody>
        {groups.map((group, index) => <Fragment key={group.label}>{index > 0 && <tr className={s.group}><th colSpan={selected.length + 1} scope="colgroup">{group.label}</th></tr>}{group.rows.filter(row => !row.applies || data.some(d => !d || row.applies?.(d) !== false)).map(row => {
          const values = data.map(d => d && row.value && (!row.applies || row.applies(d)) ? row.value(d) : null);
          const known = values.filter((v): v is number => v !== null);
          const best = known.length === selected.length && new Set(known).size > 1 ? (row.lower ? Math.min(...known) : Math.max(...known)) : null;
          return <tr key={row.label}>
            <th scope="row" className={s.left} style={{ background: 'white', color: '#334155' }}>
              <span className="inline-flex items-center gap-1.5">
                {row.label}
                {row.explanation && <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label={`How ${row.label.toLowerCase()} is calculated`} className="shrink-0 rounded p-1 text-slate-500 hover:text-slate-800">
                      <Info size={14} aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-left leading-relaxed">{row.explanation}</TooltipContent>
                </Tooltip>}
              </span>
              {row.description && <span className={cn(s.muted, 'mt-1 block font-normal')}>{row.description}</span>}
            </th>
            {values.map((value, i) => <td key={selected[i]} className={row.highlight && best !== null && value === best ? s.best : undefined}>
              {value === null ? <span className={s.muted}>
                {data[i] && row.applies && !row.applies(data[i]) ? 'Not applicable' : row.value ? queries[i]?.isLoading ? 'Loading…' : data[i] && row.unavailable ? row.unavailable(data[i]!) : '—' : 'Not available'}
              </span> : row.percent ? rateText(value) : row.money ? minorText(value) : row.multiple ? multipleText(value) : countText(value)}
              {row.highlight && best !== null && value === best && <small>{row.bestLabel ?? 'Best'}</small>}
              {value !== null && data[i] && row.detail && <span className={cn(s.muted, 'mt-1 block text-xs')}>{row.detail(data[i]!)}</span>}
            </td>)}
          </tr>;
        })}</Fragment>)}
      </tbody></table></div><p className={cn(s.muted, s.padding)}>Programme rates use registrants; Pro conversion counts credited Pros; selling rates use credited Pros. The 90-day result includes only Pros approved at least 90 days ago. Activity rates exclude unknown histories. Restricted, missing and zero-denominator results show —.</p></section>
      <section className={s.split}><article className={s.panel}><div className={s.panelHead}><div><h2>How quickly Pros made their first sale</h2><p className={s.muted}>Share of Pros with a sale, by days since approval.</p></div></div><div className={s.padding}><FirstSaleChart series={names.map((name, i) => ({ name, timeline: data[i]?.first_sale_timeline }))} /></div></article><article className={cn(s.panel, s.padding)}><h2>What stands out</h2><div className={s.list}>{(() => {
        const values = data.map((d, i) => ({ name: names[i], value: d ? rate(cohortPerformance(d)?.credited_pros ?? null, d.summary.registrants.count) : null }));
        if (values.some(v => v.value === null)) return <p className={s.muted}>Complete upgrade results are needed for a fair comparison.</p>;
        const ordered = values.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        const winners = ordered.filter(v => v.value === ordered[0].value);
        return <p className={s.subtitle}><strong>{winners.map(v => v.name).join(' and ')}</strong> {winners.length === 1 ? 'has' : 'have'} the {winners.length === ordered.length ? 'same' : 'highest'} Pro conversion rate: <strong>{rateText(ordered[0].value)}</strong>.</p>;
      })()}<p className={s.muted}>Sales are measured to date, so older cohorts have had more time. First-sale checkpoints account for time since approval; cohort maturity is not supplied.</p></div></article></section>
    </>}
  </>;
}

'use client';

import { ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import type { RecruitmentAnalysis, RecruitmentFollowUp, RecruitmentStage } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysis, useRecruitmentAnalysisPeople, type RecruitmentAnalysisFilters } from '../hooks/use-recruitment';
import { countText, rate, rateText } from './analysis-presentation';
import { cohortDate, Stat, Status, Unavailable, type AnalyticsUpdate } from './RecruitmentAnalyticsOverview';
import s from './recruitment-analytics.module.css';

type Drill = (kind: 'stage' | 'follow_up', value: RecruitmentStage | RecruitmentFollowUp, cohortId: string) => void;

function ProTable({ data, cohortId, filters, page, search, update }: {
  data: RecruitmentAnalysis; cohortId: string; filters: RecruitmentAnalysisFilters; page: number; search: string; update: AnalyticsUpdate;
}) {
  const debouncedSearch = useDebounce(search, 300);
  const people = useRecruitmentAnalysisPeople({ filters: { ...filters, cohort_id: cohortId }, stage: 'approved_upgrade', page, limit: 10, search: debouncedSearch });
  const total = people.data?.meta.total ?? 0;
  return <section className={s.panel}>
    <div className={s.panelHead}><div><h2>Associate Pros in this cohort</h2><p className={s.muted}>{countText(data.summary.approved_upgrades.count)} approved Pros</p></div><input aria-label="Search Associate Pros" className={s.search} placeholder="Search name or email" value={search} onChange={e => update({ pro_search: e.target.value, pro_page: null })} /></div>
    <div className={s.tableWrap}><table className={s.table} style={{ minWidth: 1000 }}><thead><tr>{['Associate Pro', 'Approved', 'Meetings attended', 'Other activities', 'Days to first sale', 'Sales', 'Sales value', 'Pros brought in'].map((label, i) => <th key={label} className={i === 0 ? s.left : undefined}>{label}</th>)}</tr></thead><tbody>
      {people.data?.items.map(p => <tr key={p.id}><th scope="row" className={s.left} style={{ background: 'transparent' }}><strong className="text-slate-800">{p.first_name} {p.last_name}</strong><span className={cn(s.muted, 'block')}>{p.email}</span></th>{Array.from({ length: 7 }, (_, i) => <td key={i} title="Not supplied by the current API">—</td>)}</tr>)}
      {!people.data?.items.length && <tr><td colSpan={8}><div className={s.empty}>{people.isLoading ? 'Loading Associate Pros…' : people.error ? <><p role="alert">Unable to load Associate Pros.</p><button className={s.link} onClick={() => void people.refetch()}>Try again</button></> : 'No Associate Pros match this selection.'}</div></td></tr>}
    </tbody></table></div>
    <div className={s.footer}><span>Activity, sale and approval details are not supplied yet.</span><div className={s.chips}><span>{total} results</span><button className={s.button} disabled={page <= 1 || people.isFetching} onClick={() => update({ pro_page: String(page - 1) })}>Previous</button><span>Page {page}</span><button className={s.button} disabled={page * 10 >= total || people.isFetching} onClick={() => update({ pro_page: String(page + 1) })}>Next</button></div></div>
  </section>;
}

export function RecruitmentAnalyticsDetail({ cohortId, filters, onBack, onCompare, onDrill, proPage, proSearch, update }: {
  cohortId: string; filters: RecruitmentAnalysisFilters; onBack: () => void; onCompare: () => void; onDrill: Drill;
  proPage: number; proSearch: string; update: AnalyticsUpdate;
}) {
  const query = useRecruitmentAnalysis({ ...filters, cohort_id: cohortId });
  const data = query.data;
  const cohort = data?.cohorts.find(c => c.id === cohortId);
  const back = <button className={s.link} onClick={onBack}><ArrowLeft size={15} className="mr-2 inline" />Recruitment Analytics</button>;
  if (query.isLoading) return <>{back}<div className={s.empty}><Loader2 className="animate-spin" />Loading cohort…</div></>;
  if (query.error) return <>{back}<div className={s.error} role="alert">{query.error.message}<button className={s.link} onClick={() => void query.refetch()}> Try again</button></div></>;
  if (!data || !cohort) return <>{back}<Unavailable title="Cohort not found">Return to the overview to select an available cohort.</Unavailable></>;
  const summary = data.summary;
  const selling = summary.active_associate_pros.count === null ? null : summary.active_associate_pros.confirmed_sale_only + summary.active_associate_pros.both;
  const journey = data.journey.filter(item => item.stage !== 'active_associate_pro');
  const stopped: { label: string; key?: RecruitmentFollowUp }[] = [
    { label: 'Registered, never attended', key: 'registered_without_attendance' },
    { label: 'Attended, didn’t take the test', key: 'attended_without_test_attempt' },
    { label: 'Took the test, didn’t pass', key: 'attempted_without_test_pass' },
    { label: 'Passed, not upgraded to Pro', key: 'passed_without_approved_upgrade' },
    { label: 'Pros who haven’t sold yet', key: 'approved_without_confirmed_sale' },
  ];
  return <>
    <div>{back}<span className={s.muted}> / {cohort.name}</span></div>
    <header className={s.heading}><div><div className={s.chips}><h1>{cohort.name}</h1><Status cohort={cohort} /></div><p className={s.subtitle}>{cohort.programme_name} · Created {cohortDate(cohort.created_at)}</p></div><button className={s.button} onClick={onCompare}>Compare with another cohort</button></header>
    <section className={s.summary} aria-label="Cohort results">
      <Stat label="Registrants" value={countText(summary.registrants.count)} foot={cohort.registration_goal > 0 ? `goal ${countText(cohort.registration_goal)}` : 'No registration goal set'} />
      <Stat label="Became Associate Pro" value={countText(summary.approved_upgrades.count)} foot={`${rateText(rate(summary.approved_upgrades.count, summary.registrants.count))} of registrants`} />
      <Stat label="Pros selling" value={countText(selling)} foot={`${rateText(rate(selling, summary.approved_upgrades.count))} of approved Pros`} />
      <Stat label="Sales brought in" value="—" foot="Sales value not available" />
      <Stat label="Pros they brought in" value="—" foot="Recruit totals not available" />
      <Stat label="Return on cost" value="—" foot="Sales and costs not available" />
    </section>
    {(summary.attendees.count === 0 || summary.attendees.count === null || data.coverage.attendees.missing_segments > 0) && <aside className={s.notice}>Attendance records {summary.attendees.count === 0 ? 'show no attendees' : 'are incomplete'}. Historical meeting verification may need to be included.</aside>}
    <section className={s.split}>
      <article className={cn(s.panel, s.padding)}><h2>Journey</h2><p className={s.muted}>People who reached each stage · bars show the share of registrants.</p><div className={s.journey}>
        {journey.map(item => { const share = rate(item.count, summary.registrants.count); return <div key={item.stage}><button className={s.journeyRow} disabled={item.count === null} onClick={() => onDrill('stage', item.stage, cohortId)}><span>{item.label}</span><span className={s.track}><span className={s.bar} style={{ width: `${Math.max(0, Math.min(100, share ?? 0))}%` }} /></span><strong>{countText(item.count)}</strong><small className={s.muted}>{rateText(share)}</small></button>{item.missing_cohorts > 0 && <p className={s.muted}>Tracking incomplete</p>}</div>; })}
        <div className={s.journeyRow}><span>Made a sale</span><span className={s.track}><span className={s.bar} style={{ width: `${Math.max(0, Math.min(100, rate(selling, summary.registrants.count) ?? 0))}%` }} /></span><strong>{countText(selling)}</strong><small className={s.muted}>{rateText(rate(selling, summary.registrants.count))}</small></div>
      </div></article>
      <article className={cn(s.panel, s.padding)}><h2>Where people stopped</h2><p className={s.muted}>Open an available list to follow up.</p><div className={s.stopped}>{stopped.map(row => { const item = row.key ? data.follow_up[row.key] : undefined; return <button key={row.label} className={s.stop} disabled={!item?.available || item.count === null} onClick={() => row.key && onDrill('follow_up', row.key, cohortId)}><span>{row.label}{(!item?.available || item.count === null) && <small className={cn(s.muted, 'block')}>Not available</small>}</span><strong>{countText(item?.available ? item.count : null)}</strong>{item?.available && item.count !== null && <ArrowUpRight size={16} />}</button>; })}</div></article>
    </section>
    <section className={cn(s.panel, s.padding)}><h2>How this cohort’s Associate Pros are doing</h2><p className={s.muted}>What approved Pros have brought in, set against what the cohort cost.</p><div className={cn(s.halves, 'mt-6')}>
      <div><h3>What they’ve brought in</h3><div className={s.list}><div className={s.row}><span>Sales</span><strong>—</strong></div><p className={s.muted}>{countText(selling)} Pros with a confirmed sale · sales value unavailable</p><div className={s.row}><span>People</span><strong>—</strong></div><p className={s.muted}>Recruited people and approved recruit totals are not available.</p></div><h3 className="mt-8">Sales since the cohort closed</h3><Unavailable title="Sales history is not available">A dated sales breakdown is needed for this chart.</Unavailable></div>
      <div><h3>Against what it cost</h3><div className={s.list}>{['Total cohort cost', 'Ads', 'Events and venue', 'Facilitators', 'Tools and messaging'].map(label => <div className={s.row} key={label}><span className={s.muted}>{label}</span><strong>—</strong></div>)}</div><div className={s.cost}><h3>What each one cost</h3><div className={s.list}>{['Per registrant', 'Per Associate Pro', 'Per selling Pro'].map(label => <div className={s.row} key={label}><span className={s.muted}>{label}</span><strong>—</strong></div>)}</div></div><div className={s.return}>Return on cost will appear when sales and cost data are available.</div></div>
    </div></section>
    <section className={s.panel}><div className={s.panelHead}><div><h2>Meetings &amp; activities vs selling</h2><p className={s.muted}>Selling rates for Pros who took part and those who didn’t.</p></div></div><div className={s.tableWrap}><table className={s.table} style={{ minWidth: 680 }}><thead><tr><th className={s.left}>Activity</th><th>Pros who took part</th><th>Share who went on to sell</th><th>Difference</th></tr></thead><tbody>{['Weekly meeting, at least one', 'Three meetings in the first 30 days', 'Allocation event', 'Recruited at least one person', 'Site inspection', 'Sales marathon'].map(label => <tr key={label}><td className={s.left}>{label}</td><td>—</td><td className={s.muted}>Not available</td><td>—</td></tr>)}</tbody></table></div><p className={cn(s.muted, s.padding)}>The current API does not supply activity participation or activity-to-sale comparisons.</p></section>
    <ProTable data={data} cohortId={cohortId} filters={filters} page={proPage} search={proSearch} update={update} />
  </>;
}

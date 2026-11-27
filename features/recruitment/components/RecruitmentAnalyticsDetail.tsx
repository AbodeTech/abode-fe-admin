'use client';

import { ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecruitmentFollowUp, RecruitmentStage } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysis, type RecruitmentAnalysisFilters } from '../hooks/use-recruitment';
import { countText, rate, rateText } from './analysis-presentation';
import { cohortDate, Stat, Status, Unavailable, type AnalyticsUpdate } from './RecruitmentAnalyticsOverview';
import s from './recruitment-analytics.module.css';
import { RecruitmentProTable } from './RecruitmentProTable';
import { RecruitmentPerformancePanels } from './RecruitmentPerformancePanels';
import { costNote, moneyText, compactMinorText, multipleText } from './analytics-performance';

type Drill = (kind: 'stage' | 'follow_up', value: RecruitmentStage | RecruitmentFollowUp, cohortId: string) => void;

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
  const performance = cohort.performance;
  const cost = performance?.cost;
  const selling = performance?.selling_pros ?? null;
  const pros = performance?.credited_pros ?? null;
  const attendance = cohort.attendance;
  const journey = data.journey.filter(item => item.stage !== 'active_associate_pro');
  const stopped: { label: string; key?: RecruitmentFollowUp }[] = [
    { label: 'Registered, never attended', key: 'registered_without_attendance' },
    { label: 'Attended, didn’t take the test', key: 'attended_without_test_attempt' },
    { label: 'Took the test, didn’t pass', key: 'attempted_without_test_pass' },
    { label: 'Passed, not upgraded to Pro', key: 'passed_without_approved_upgrade' },
    { label: 'Pros who haven’t sold yet', key: 'approved_without_confirmed_sale' },
  ];
  return <>
    <header className={s.heading}><div><div className={s.chips}><h1>{cohort.name}</h1><Status cohort={cohort} /></div><p className={s.subtitle}>{cohort.programme_name} · Created {cohortDate(cohort.created_at)}</p></div><button className={s.button} onClick={onCompare}>Compare with another cohort</button></header>
    <section className={s.summary} aria-label="Cohort results">
      <Stat label="Registrants" value={countText(summary.registrants.count)} foot={cohort.registration_goal > 0 ? `goal ${countText(cohort.registration_goal)}` : 'No registration goal set'} />
      <Stat label="Became Associate Pro" value={countText(pros)} foot={`${rateText(rate(pros, summary.registrants.count))} of registrants · credited once`} />
      <Stat label="Pros selling" value={countText(selling)} foot={`${rateText(rate(selling, pros))} of credited Pros`} />
      <Stat label="Sales value" value={performance ? compactMinorText(performance.contract_value.amount_minor) : '—'} valueTitle={moneyText(performance?.contract_value)} foot={`${moneyText(performance?.revenue)} paid to date`} />
      <Stat label="Pros they brought in" value={countText(performance?.approved_recruits ?? null)} foot="Approved recruits since Pro approval" />
      <Stat label="Revenue" value={moneyText(performance?.revenue)} foot={cost?.availability === 'tracked' && cost.return_on_revenue != null ? `${multipleText(cost.return_on_revenue)} the recorded cost` : costNote(cost)} />
    </section>
    {attendance && <p className={s.muted}>{cohort.programme_name} attendance: {countText(attendance.checkin_only)} check-in only · {countText(attendance.meeting_verification_only)} meeting verification only · {countText(attendance.both)} both. Each attendee counts once.</p>}
    <section className={s.split}>
      <article className={cn(s.panel, s.padding)}><h2>Journey</h2><p className={s.muted}>People who reached each stage · bars show the share of registrants.</p><div className={s.journey}>
        {journey.map(item => { const share = rate(item.count, summary.registrants.count); return <div key={item.stage}><button className={s.journeyRow} disabled={item.count === null} onClick={() => onDrill('stage', item.stage, cohortId)}><span>{item.stage === 'approved_upgrade' ? 'Approved members' : item.label}</span><span className={s.track}><span className={s.bar} style={{ width: `${Math.max(0, Math.min(100, share ?? 0))}%` }} /></span><strong>{countText(item.count)}</strong><small className={s.muted}>{rateText(share)}</small></button>{item.missing_cohorts > 0 && <p className={s.muted}>Tracking incomplete</p>}</div>; })}
        <div className={s.journeyRow}><span>Credited Pros selling</span><span className={s.track}><span className={s.bar} style={{ width: `${Math.max(0, Math.min(100, rate(selling, summary.registrants.count) ?? 0))}%` }} /></span><strong>{countText(selling)}</strong><small className={s.muted}>{rateText(rate(selling, summary.registrants.count))}</small></div>
      </div></article>
      <article className={cn(s.panel, s.padding)}><h2>Where people stopped</h2><p className={s.muted}>Open an available list to follow up.</p><div className={s.stopped}>{stopped.map(row => { const item = row.key ? data.follow_up[row.key] : undefined; return <button key={row.label} className={s.stop} disabled={!item?.available || item.count === null} onClick={() => row.key && onDrill('follow_up', row.key, cohortId)}><span>{row.label}{(!item?.available || item.count === null) && <small className={cn(s.muted, 'block')}>Not available</small>}</span><strong>{countText(item?.available ? item.count : null)}</strong>{item?.available && item.count !== null && <ArrowUpRight size={16} />}</button>; })}</div></article>
    </section>
    <RecruitmentPerformancePanels data={data} />
    <RecruitmentProTable cohortId={cohortId} filters={filters} page={proPage} search={proSearch} update={update} />
  </>;
}

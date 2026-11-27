'use client';

import { cn } from '@/lib/utils';
import type { RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';
import { countText, rateText } from './analysis-presentation';
import { activityApplies } from './analytics-performance';
import s from './recruitment-analytics.module.css';

const missingLabels: Record<string, string> = {
  allocation_event: 'No allocation check-ins found',
  sales_marathon: 'No sales-marathon sessions found',
  weekly_meeting_any: 'No weekly meeting sessions found',
  weekly_meetings_three_in_30_days: 'No weekly meeting sessions found',
};

function SellingRateBar({ value, participated, people, sellers }: { value: number | null; participated: boolean; people: number; sellers: number }) {
  const label = participated ? 'Took part' : 'Didn’t take part';
  return <div className={s.activityBarLine} role="img" aria-label={`${label}: ${value === null ? 'selling rate unavailable' : `${rateText(value)} selling rate`}; ${countText(sellers)} sellers among ${countText(people)} Pros`} title={`${label}: ${countText(sellers)} of ${countText(people)} Pros sold`}>
    <span aria-hidden className={cn(s.activityBarFill, !participated && s.activityBarMuted)} style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }} />
    <span aria-hidden className={cn(s.activityBarValue, participated && 'font-semibold')}>{rateText(value)}</span>
  </div>;
}

export function RecruitmentActivityComparison({ data }: { data: RecruitmentAnalysis }) {
  const rows = data.activity_analysis?.rows.filter(row => row.key !== 'site_inspection' && activityApplies(data, row.key)) ?? [];
  return <section className={s.panel}>
    <div className={s.panelHead}>
      <div><h2>Meetings &amp; activities vs selling</h2><p className={s.muted}>For each activity, compare the share who sold among Pros who took part and those who didn’t.</p></div>
      <div className={s.activityLegend} aria-label="Chart legend"><span><i aria-hidden />Took part</span><span><i aria-hidden className={s.activityBarMuted} />Didn’t take part</span></div>
    </div>
    <div className={s.tableWrap}>
      <table className={s.activityTable}>
        <thead><tr><th scope="col">Activity</th><th scope="col">Pros who took part</th><th scope="col">Share who went on to sell</th><th scope="col">Difference</th></tr></thead>
        <tbody>{rows.map(row => {
          const tracked = row.availability === 'tracked';
          const noHistory = tracked && row.participants + row.nonparticipants === 0;
          return <tr key={row.key}>
            <th scope="row">
              <span title={tracked ? `${row.data_source}. ${row.window}` : row.data_source}>{row.key === 'weekly_meetings_three_in_30_days' ? 'Weekly meetings, three or more' : row.label}</span>
              {tracked && row.unknown > 0 && <span className={s.partialData} title={`${countText(row.unknown)} Pros have an open observation period or incomplete historical records. They are excluded from selling rates.`}>Partial data</span>}
              {row.key === 'weekly_meetings_three_in_30_days' && <small>In their first 30 days as a Pro</small>}
            </th>
            <td>{tracked ? <>{countText(row.participants)} of {countText(row.eligible_pros)}{row.unknown > 0 && !noHistory && <small>{countText(row.unknown)} with incomplete history</small>}</> : '—'}</td>
            <td>
              {!tracked ? <div className={s.activityUnavailable}>{row.reason === 'activity_not_recorded' ? `Not tracked yet: ${missingLabels[row.key] ?? 'No activity records found'}` : 'Activity data unavailable'}</div>
                : noHistory ? <div className={s.activityUnavailable}>{row.unknown > 0 ? `Participation cannot be determined yet for ${countText(row.unknown)} Pros` : 'No eligible Pros for this activity'}</div>
                  : <div className={s.activityBars}>
                    <SellingRateBar value={row.selling_rate_participants} participated people={row.participants} sellers={row.sellers_among_participants} />
                    <SellingRateBar value={row.selling_rate_nonparticipants} participated={false} people={row.nonparticipants} sellers={row.sellers_among_nonparticipants} />
                  </div>}
            </td>
            <td className={tracked && row.difference_points !== null ? row.difference_points > 0 ? s.activityPositive : row.difference_points < 0 ? s.activityNegative : undefined : undefined}>
              {tracked && row.difference_points !== null ? <span title="Difference in selling rates, in percentage points">{row.difference_points > 0 ? '+' : ''}{countText(row.difference_points)} pts</span> : '—'}
            </td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className={s.empty}>Activity comparisons are unavailable.</p>}
    </div>
    <div className={cn(s.muted, s.padding)}>
      <p>Activity counts from Pro approval to the first sale, or the first 60 days without a sale. The three-meeting measure uses 30 days. This shows a link, not proof that an activity caused a sale.</p>
      {rows.some(row => row.availability === 'tracked' && row.unknown > 0) && <details className="mt-2"><summary className="cursor-pointer font-medium text-slate-700">About partial data</summary><p className="mt-2">Some Pros’ observation periods are still open, or tracking started after their approval. These Pros remain in the cohort total but are excluded from both selling-rate groups. Missing records do not mean they didn’t take part.</p></details>}
    </div>
  </section>;
}

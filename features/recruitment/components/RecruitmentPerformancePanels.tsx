'use client';

import { cn } from '@/lib/utils';
import type { RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';
import { countText } from './analysis-presentation';
import { cohortPerformance, costNote, moneyText, compactMinorText, minorText, multipleText } from './analytics-performance';
import { FirstSaleChart, SalesChart } from './RecruitmentAnalyticsCharts';
import { RecruitmentActivityComparison } from './RecruitmentActivityComparison';
import { CohortCostsButton } from './CohortCostsManager';
import s from './recruitment-analytics.module.css';

const categoryNames: Record<string, string> = { ads: 'Ads', events_venue: 'Events and venue', facilitators: 'Facilitators', tools_messaging: 'Tools and messaging', other: 'Other' };
const costColors = ['#134e4a', '#0f766e', '#5ba99c', '#b3ddd4', '#94a3b8'];
export function RecruitmentPerformancePanels({ data }: { data: RecruitmentAnalysis }) {
  const performance = cohortPerformance(data);
  const cost = performance?.cost;
  return <>
    <div className={s.halves}>
      <section className={cn(s.panel, s.padding)} aria-label="Cohort sales and recruits">
        <h2>What they’ve brought in</h2>
        <div className={s.outcomeTiles}>
          <div className={s.outcomeTile}>
            <span className={s.outcomeLabel}>Sales</span>
            <strong title={moneyText(performance?.contract_value)}>{performance ? compactMinorText(performance.contract_value.amount_minor) : '—'}</strong>
            <p>{countText(performance?.plans_sold ?? null)} plans sold by {countText(performance?.selling_pros ?? null)} Pros</p>
            <p>{moneyText(performance?.contract_value_per_selling_pro)} per selling Pro</p>
            <p>{moneyText(performance?.revenue)} paid to date</p>
          </div>
          <div className={s.outcomeTile}>
            <span className={s.outcomeLabel}>People</span>
            <strong>{countText(performance?.approved_recruits ?? null)} new Pros</strong>
            <p>Approved recruits brought in by this cohort’s Pros</p>
          </div>
        </div>
        <h3 className="mt-5">Sales by month</h3>
        <SalesChart timeline={data.sales_timeline} />
      </section>
      <section className={cn(s.panel, s.padding)} aria-label="Cohort costs and return">
        <div className={s.row}><h2>Against what it cost</h2>{data.filters.cohort_id && <CohortCostsButton cohortId={data.filters.cohort_id} />}</div>
        {cost?.availability === 'tracked' ? <>
          <div className={s.costTotal}><span>Total cohort cost</span><strong title={moneyText(cost.total)}>{compactMinorText(cost.total.amount_minor)}</strong></div>
          <div className={s.costComposition} role="img" aria-label={`Cost breakdown. Total ${moneyText(cost.total)}`}>
            {Object.entries(cost.by_category).map(([key, amount], index) => <span key={key} title={`${categoryNames[key] ?? key.replaceAll('_', ' ')}: ${moneyText(amount)}`} style={{ width: `${cost.total.amount_minor > 0 ? Math.max(0, amount.amount_minor) / cost.total.amount_minor * 100 : 0}%`, backgroundColor: costColors[index % costColors.length] }} />)}
          </div>
          <div className={s.costLegend}>
            {Object.entries(cost.by_category).map(([key, amount], index) => <div key={key}><span className={s.categoryLabel}><i aria-hidden style={{ backgroundColor: costColors[index % costColors.length] }} />{categoryNames[key] ?? key.replaceAll('_', ' ')}</span><strong title={moneyText(amount)}>{compactMinorText(amount.amount_minor)}</strong></div>)}
          </div>
          <table className={s.unitCosts}>
            <thead><tr><th scope="col">What each one cost</th><th scope="col">This cohort</th></tr></thead>
            <tbody>
              <tr><th scope="row">Per registrant</th><td>{moneyText(cost.cost_per_registrant)}</td></tr>
              <tr><th scope="row">Per Associate Pro</th><td>{moneyText(cost.cost_per_pro)}</td></tr>
              <tr><th scope="row">Per selling Pro</th><td>{moneyText(cost.cost_per_selling_pro)}</td></tr>
            </tbody>
          </table>
          <div className={s.costReturn}><span>Money paid for every ₦1 spent on this cohort</span><strong>{cost.return_on_revenue === null ? '—' : minorText(cost.return_on_revenue * 100)}</strong></div>
          <p className={cn(s.muted, 'mt-2')}>{cost.total.amount_minor === 0 ? 'No return ratio for zero cost.' : `${multipleText(cost.return_on_contract_value)} sales value per ₦1 spent`}</p>
        </> : <p className={s.empty}>{costNote(cost)}</p>}
      </section>
    </div>
    <section className={cn(s.panel, s.padding)}>
      <h2>Time to first sale</h2>
      <FirstSaleChart series={[{ name: 'Pros selling', timeline: data.first_sale_timeline }]} />
    </section>
    <RecruitmentActivityComparison data={data} />
  </>;
}

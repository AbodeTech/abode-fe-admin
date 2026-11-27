'use client';

import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { AnalysisPeopleSellingSchema, AnalysisPeopleSortSchema } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysisPeople, type RecruitmentAnalysisFilters } from '../hooks/use-recruitment';
import { AnalyticsSelect } from './AnalyticsSelect';
import { countText } from './analysis-presentation';
import { moneyText } from './analytics-performance';
import { cohortDate, type AnalyticsUpdate } from './RecruitmentAnalyticsOverview';
import s from './recruitment-analytics.module.css';

export function RecruitmentProTable({ cohortId, filters, page, search, update }: {
  cohortId: string; filters: RecruitmentAnalysisFilters; page: number; search: string; update: AnalyticsUpdate;
}) {
  const params = useSearchParams();
  const sellingStatus = AnalysisPeopleSellingSchema.safeParse(params.get('pro_selling')).data ?? 'all';
  const sortBy = AnalysisPeopleSortSchema.safeParse(params.get('pro_sort')).data ?? 'sales_value';
  const sortDirection = params.get('pro_direction') === 'asc' ? 'asc' : 'desc';
  const debouncedSearch = useDebounce(search, 300);
  const people = useRecruitmentAnalysisPeople({ filters: { ...filters, cohort_id: cohortId }, stage: 'approved_upgrade', page, limit: 10, search: debouncedSearch, sellingStatus, sortBy, sortDirection });
  const total = people.data?.meta.total ?? 0;
  return <section className={s.panel}>
    <div className={s.panelHead}><div><h2>Associate Pros in this cohort</h2><p className={s.muted}>Cohort members with an approved upgrade. Commercial credit may belong to another cohort.</p></div>
      <input aria-label="Search Associate Pros" className={s.search} placeholder="Search name or email" value={search} onChange={e => update({ pro_search: e.target.value, pro_page: null })} />
    </div>
    <div className={cn(s.filters, s.padding)}>
      <AnalyticsSelect label="Selling status" value={sellingStatus} onChange={value => update({ pro_selling: value, pro_page: null })} options={[{ value: 'all', label: 'All Pros' }, { value: 'selling', label: 'Selling' }, { value: 'not_selling', label: 'Not selling' }]} />
      <AnalyticsSelect label="Sort by" value={sortBy} onChange={value => update({ pro_sort: value, pro_page: null })} options={[{ value: 'sales_value', label: 'Sales value' }, { value: 'revenue', label: 'Money paid' }, { value: 'approved_recruits', label: 'Pros recruited' }, { value: 'approved_at', label: 'Approval date' }]} />
      <AnalyticsSelect label="Order" value={sortDirection} onChange={value => update({ pro_direction: value, pro_page: null })} options={[{ value: 'desc', label: 'Highest / newest first' }, { value: 'asc', label: 'Lowest / oldest first' }]} />
    </div>
    <div className={s.tableWrap}><table className={s.table} style={{ minWidth: 1000 }}><thead><tr>{['Associate Pro', 'Approved', 'Days to first sale', 'Plans sold', 'Sales value', 'Money paid', 'Pros recruited'].map((label, i) => <th key={label} className={i === 0 ? s.left : undefined}>{label}</th>)}</tr></thead><tbody>
      {!people.error && people.data?.items.map(p => <tr key={p.id}>
        <th scope="row" className={s.left} style={{ background: 'transparent' }}><strong className="text-slate-800">{p.first_name} {p.last_name}</strong><span className={cn(s.muted, 'block')}>{p.email}</span>{p.phone_number && <span className={cn(s.muted, 'block')}>{p.phone_number}</span>}{p.pro && !p.pro.credited_to_this_cohort && <span className={cn(s.badge, 'mt-2')}>Credited elsewhere</span>}</th>
        <td>{p.pro ? cohortDate(p.pro.approved_at) : '—'}</td><td>{countText(p.pro?.days_to_first_sale ?? null)}</td><td>{countText(p.pro?.plans_sold ?? null)}</td><td>{moneyText(p.pro?.contract_value)}</td><td>{moneyText(p.pro?.revenue)}</td><td>{countText(p.pro?.approved_recruits ?? null)}</td>
      </tr>)}
      {(people.error || !people.data?.items.length) && <tr><td colSpan={7}><div className={s.empty}>{people.isLoading ? 'Loading Associate Pros…' : people.error ? <><p role="alert">Unable to load Associate Pros.</p><button className={s.link} onClick={() => void people.refetch()}>Try again</button></> : 'No Associate Pros match this selection.'}</div></td></tr>}
    </tbody></table></div>
    <div className={s.footer}><span>{countText(total)} results</span><div className={s.chips}><button className={s.button} disabled={page <= 1 || people.isFetching} onClick={() => update({ pro_page: String(page - 1) })}>Previous</button><span>Page {page}</span><button className={s.button} disabled={page * 10 >= total || people.isFetching || Boolean(people.error)} onClick={() => update({ pro_page: String(page + 1) })}>Next</button></div></div>
  </section>;
}

'use client';

import { Area, ComposedChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RecruitmentAnalysis } from '../schemas/recruitment-analysis.schema';
import { median, type AnalysisCohort } from './analysis-presentation';
import { costNote, minorText, multipleText } from './analytics-performance';
import s from './recruitment-analytics.module.css';

const colors = ['#0f766e', '#2563eb', '#ea580c', '#9333ea'];

export function ReturnChart({ cohorts, onOpen }: { cohorts: AnalysisCohort[]; onOpen: (id: string) => void }) {
  const rows = [...cohorts].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || a.id.localeCompare(b.id)).slice(0, 12).reverse();
  const values = rows.map(c => c.performance?.cost.availability === 'tracked' ? c.performance.cost.return_on_revenue : null);
  const known = values.filter((v): v is number => v !== null);
  const maximum = Math.max(1, ...known);
  if (!rows.length) return <p className={s.empty}>No cohorts match this selection.</p>;
  return <div className={s.padding}>
    <div className={s.returnChart}>{rows.map((cohort, index) => <button key={cohort.id} className={s.returnRow} onClick={() => onOpen(cohort.id)}>
      <span>{cohort.name}</span>
      {values[index] === null ? <span className={s.returnUnavailable}>{costNote(cohort.performance?.cost)}</span> : <>
        <span className={s.track}><span className={s.bar} style={{ width: `${Math.max(0, values[index] ?? 0) / maximum * 100}%` }} /></span>
        <strong>{multipleText(values[index])}</strong>
      </>}
    </button>)}</div>
    <p className={s.muted}>{known.length ? `Latest ${rows.length} cohorts by creation · median ${multipleText(median(values))} across ${known.length} with return data.` : 'No return figures available for these cohorts.'}</p>
  </div>;
}

export function SalesChart({ timeline }: { timeline: RecruitmentAnalysis['sales_timeline'] }) {
  if (!timeline) return <p className={s.empty}>Sales history is unavailable.</p>;
  if (!timeline.months.length) return <p className={s.empty}>No plans sold by this cohort’s credited Pros.</p>;
  const rows = timeline.months.map(m => ({ month: m.month, 'Sales value': m.contract_value.amount_minor / 100, 'Money paid': m.revenue.amount_minor / 100, plans: m.plans_sold }));
  return <><div className={`${s.chart} ${s.salesChart}`}>
    <ResponsiveContainer width="100%" height="100%"><ComposedChart data={rows} margin={{ top: 12, right: 14, bottom: 8, left: 4 }} accessibilityLayer>
      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={20} />
      <YAxis width={64} tick={{ fontSize: 11 }} tickFormatter={v => `₦${new Intl.NumberFormat('en-NG', { notation: 'compact' }).format(v)}`} />
      <Tooltip formatter={(v) => minorText(Number(v) * 100)} labelFormatter={(label, payload) => `${label} · ${payload[0]?.payload.plans ?? 0} plans sold`} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Area type="linear" dataKey="Sales value" stroke={colors[0]} fill="#e5f3f0" fillOpacity={1} strokeWidth={2} dot={{ r: 3 }} />
      <Line type="linear" dataKey="Money paid" stroke={colors[1]} strokeWidth={2} dot={{ r: 3 }} />
    </ComposedChart></ResponsiveContainer>
  </div><p className={s.muted}>Grouped by sale month. Money paid is the amount received to date on those plans.</p></>;
}

export function FirstSaleChart({ series }: { series: { name: string; timeline: RecruitmentAnalysis['first_sale_timeline'] }[] }) {
  const days = [...new Set(series.flatMap(s => s.timeline?.points.map(p => p.day) ?? []))].sort((a, b) => a - b);
  if (series.every(item => !item.timeline)) return <p className={s.empty}>First-sale timelines are unavailable.</p>;
  if (!days.length) return <p className={s.empty}>No eligible first-sale checkpoints yet.</p>;
  const rows = days.map(day => ({ day, ...Object.fromEntries(series.map((s, i) => [`cohort${i}`, s.timeline?.points.find(p => p.day === day)?.percent ?? null])) }));
  return <><div className={s.chart}>
    <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 16, bottom: 8, left: 0 }} accessibilityLayer>
      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="day" type="number" domain={['dataMin', 'dataMax']} tickFormatter={v => `${v}d`} tick={{ fontSize: 11 }} />
      <YAxis domain={[0, 100]} width={45} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
      <Tooltip formatter={(value, name, item) => {
        const index = Number(String(item.dataKey).replace('cohort', ''));
        const point = series[index]?.timeline?.points.find(p => p.day === item.payload.day);
        return [`${value}% (${point?.sellers ?? 0} of ${point?.eligible ?? 0} eligible Pros)`, name];
      }} labelFormatter={day => `Within ${day} days of approval`} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      {series.map((item, i) => <Line key={i} name={item.name} dataKey={`cohort${i}`} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />)}
    </LineChart></ResponsiveContainer>
  </div><p className={s.muted}>Each checkpoint includes only Pros approved at least that many days ago. Missing checkpoints are not zero.</p></>;
}

'use client';

import { useMemo } from 'react';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { countText, rateText, recruitmentAttention, type AnalysisCohort, type AnalysisMetric } from './analysis-presentation';

export function RecruitmentNeedsAttention({ cohorts, metric, onOpenCohort }: {
  cohorts: AnalysisCohort[];
  metric: AnalysisMetric;
  onOpenCohort: (id: string) => void;
}) {
  const { rows, comparableCohorts } = useMemo(() => recruitmentAttention(cohorts, metric), [cohorts, metric]);
  const label = metric === 'selling' ? 'Pros selling' : 'Became Pro';
  const outcome = metric === 'selling' ? 'selling Pros' : 'upgrades';
  return (
    <section aria-labelledby="needs-attention-title" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="needs-attention-title" className="text-sm font-bold text-slate-900">Needs attention</h2>
        {rows.length > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700">{rows.length} cohort{rows.length === 1 ? '' : 's'}</span>}
      </div>
      <p className="mt-1 text-xs text-slate-500">Closed cohorts at least 15% below their programme median on {label}.</p>
      {rows.length ? <>
        <div className="mt-4 divide-y divide-slate-100">
          {rows.slice(0, 7).map(({ cohort, value, base, baseline, belowMedian, peopleGap }) => (
            <button key={cohort.id} type="button" aria-haspopup="dialog" onClick={() => onOpenCohort(cohort.id)} className="grid w-full grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-4 text-left transition hover:bg-slate-50 focus-visible:outline-blue-500 sm:grid-cols-[20px_minmax(0,1fr)_minmax(80px,160px)_90px_16px]">
              <AlertCircle aria-hidden="true" className="h-4 w-4 text-red-500" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-800">{cohort.name}</span>
                <span className="mt-1 block text-[11px] text-slate-500">{rateText(value)} vs {rateText(baseline)} {cohort.programme_name} median · {countText(base)} {metric === 'selling' ? 'approved Pros' : 'registrants'}</span>
                <span className="mt-1 block text-[10px] text-slate-400">At median rate: ≈{peopleGap < 1 ? peopleGap.toFixed(1) : Math.round(peopleGap).toLocaleString('en-NG')} more {outcome}</span>
              </span>
              <span aria-hidden="true" className="relative hidden h-2 rounded bg-slate-100 sm:block"><span className="absolute inset-y-0 right-1/2 rounded-l bg-red-400" style={{ width: `${Math.min(50, belowMedian / 2)}%` }} /><span className="absolute -bottom-1 -top-1 left-1/2 border-l border-slate-400" /></span>
              <span className="text-right text-[11px] font-semibold text-red-600 tabular-nums">▼ {rateText(belowMedian)}<span className="mt-0.5 block text-[10px] font-normal">below median</span></span>
              <ArrowUpRight aria-hidden="true" className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-400">{rows.length > 7 ? 'Top 7 · ' : ''}Ranked by the estimated {outcome} needed to reach the programme median.</p>
      </> : <p role="status" className="py-8 text-center text-xs text-slate-500">{comparableCohorts === 0 ? 'Not enough comparable data. Each programme needs two closed cohorts with tracked outcomes and a nonzero median.' : 'No comparable closed cohorts are at least 15% below their programme median.'}</p>}
    </section>
  );
}

'use client';

import { useRef } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { RecruitmentStage } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysis, type RecruitmentAnalysisFilters } from '../hooks/use-recruitment';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cohortStage, countText, rate, rateText, type AnalysisCohort } from './analysis-presentation';

export function RecruitmentCohortDrawer({ cohort, filters, onClose, onOpenPeople }: {
  cohort: AnalysisCohort;
  filters: RecruitmentAnalysisFilters;
  onClose: () => void;
  onOpenPeople: (stage: RecruitmentStage, cohortId: string) => void;
}) {
  const opener = useRef<HTMLElement | SVGElement | null>(null);
  const query = useRecruitmentAnalysis({ ...filters, programme_id: cohort.programme_id, cohort_id: cohort.id });
  const data = query.data;
  const scopedCohort = data?.cohorts.find(item => item.id === cohort.id);
  const summary = scopedCohort ? data?.summary : undefined;
  const selling = summary?.active_associate_pros.count == null ? null
    : summary.active_associate_pros.confirmed_sale_only + summary.active_associate_pros.both;
  const openedAt = new Date(cohort.created_at);
  const dateLabel = Number.isFinite(openedAt.getTime())
    ? openedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' })
    : 'Date unavailable';
  const labels = new Map(data?.journey.map(item => [item.stage, item.label]));
  const sourceLabel = data?.filter_options.sources.find(item => item.value === filters.source)?.label ?? filters.source;

  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="gap-0 bg-white p-0 sm:max-w-[580px]"
        onOpenAutoFocus={() => { const active = document.activeElement; if (active instanceof HTMLElement || active instanceof SVGElement) opener.current = active; }}
        onCloseAutoFocus={event => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); }}>
        <SheetHeader className="shrink-0 border-b border-slate-200 px-5 py-5 pr-12 sm:px-6 sm:pr-12">
          <SheetTitle className="text-lg font-bold tracking-tight text-slate-900">{cohort.name}</SheetTitle>
          <SheetDescription className="text-xs leading-5 text-slate-500">{cohort.programme_name} · Opened {dateLabel}</SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold', cohort.status === 'registration_open' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>{cohortStage(scopedCohort ?? cohort)}</span>
            {sourceLabel && <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">Source: {sourceLabel}</span>}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {query.isLoading ? <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading cohort details…</div>
            : query.error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{query.error.message || 'Unable to load cohort details.'}</p><Button variant="link" onClick={() => void query.refetch()} className="mt-2 h-auto p-0 text-red-800">Try again</Button></div>
              : !data || !summary || !scopedCohort ? <p className="py-16 text-center text-sm text-slate-500">No cohort details match this selection.</p> : <div className="space-y-7">
                <section aria-label="Cohort summary" className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
                  {[
                    { value: rateText(rate(summary.approved_upgrades.count, summary.registrants.count)), label: 'became Pro' },
                    { value: rateText(rate(selling, summary.approved_upgrades.count)), label: 'of Pros selling' },
                    { value: '—', label: 'sales value unavailable' },
                  ].map(item => <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-4"><strong className="block text-2xl tracking-tight text-slate-900 tabular-nums">{item.value}</strong><span className="mt-1 block text-[11px] text-slate-500">{item.label}</span></div>)}
                </section>

                <section aria-labelledby="cohort-journey-title">
                  <h3 id="cohort-journey-title" className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Journey</h3>
                  <div className="space-y-1">
                    {data.journey.map(item => {
                      const share = rate(item.count, summary.registrants.count);
                      return <button type="button" key={item.stage} disabled={item.count === null} onClick={() => onOpenPeople(item.stage, cohort.id)} className="grid w-full grid-cols-[minmax(95px,1fr)_minmax(40px,1fr)_48px] items-center gap-x-3 gap-y-1 rounded-lg px-1 py-2 text-left hover:bg-slate-50 focus-visible:outline-blue-500 disabled:cursor-default" title={item.denominator_stage ? `${rateText(item.conversion_rate)} of ${labels.get(item.denominator_stage) ?? 'previous stage'}` : 'Starting stage'}>
                        <span className="text-xs font-medium text-slate-700">{item.label}</span>
                        <span className="h-2 overflow-hidden rounded bg-slate-100"><span className="block h-full rounded bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, share ?? 0))}%` }} /></span>
                        <span className="text-right text-xs font-bold text-slate-800 tabular-nums">{countText(item.count)}</span>
                        {item.count === null ? <span className="col-span-3 text-[10px] text-amber-700">Not tracked</span> : item.missing_cohorts > 0 ? <span className="col-span-3 text-[10px] text-amber-700">Partial tracking</span> : null}
                      </button>;
                    })}
                    {!data.journey.length && <p className="text-xs text-slate-500">No journey data recorded.</p>}
                  </div>
                </section>

                <section aria-labelledby="cohort-sources-title">
                  <h3 id="cohort-sources-title" className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">By source</h3>
                  <div className="overflow-x-auto"><table className="w-full min-w-[390px] text-left text-xs">
                    <thead><tr className="border-b border-slate-200 text-[10px] text-slate-500"><th scope="col" className="py-2 pr-3 font-medium">Source</th><th scope="col" className="px-2 py-2 text-right font-medium">Registrants</th><th scope="col" className="px-2 py-2 text-right font-medium">Became Pro</th><th scope="col" className="py-2 pl-2 text-right font-medium">Active APs</th></tr></thead>
                    <tbody>{data.comparison.sources.map((source, index) => <tr key={`${source.value}-${index}`} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-3 font-medium text-slate-700">{source.name || source.value || 'Unattributed'}</td><td className="px-2 py-3 text-right tabular-nums">{summary.registrants.count === null ? '—' : countText(source.registrants)}</td><td className="px-2 py-3 text-right tabular-nums">{summary.approved_upgrades.count === null ? '—' : countText(source.approved_upgrades)}</td><td className="py-3 pl-2 text-right tabular-nums">{summary.active_associate_pros.count === null ? '—' : countText(source.active_associate_pros)}</td></tr>)}{!data.comparison.sources.length && <tr><td colSpan={4} className="py-8 text-center text-slate-400">No source data recorded.</td></tr>}</tbody>
                  </table></div>
                  <p className="mt-2 text-[10px] text-slate-400">Active APs have a confirmed sale or an approved recruit.</p>
                </section>
              </div>}
        </div>
        <div className="shrink-0 border-t border-slate-200 p-5 sm:px-6">
          <Button disabled={!summary || !!query.error || summary.registrants.count === null} onClick={() => onOpenPeople('registrant', cohort.id)} className="bg-slate-900 text-white hover:bg-slate-800">Open people list <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

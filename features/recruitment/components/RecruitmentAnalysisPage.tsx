'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { RecruitmentFollowUpSchema, RecruitmentStageSchema, type RecruitmentAnalysis, type RecruitmentFollowUp, type RecruitmentStage } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysis, useRecruitmentAnalysisPeople, type RecruitmentAnalysisFilters } from '../hooks/use-recruitment';
import { useRecruitmentPeopleExport } from '../hooks/use-recruitment-people-export';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyticsFilters, RecruitmentAnalyticsOverview } from './RecruitmentAnalyticsOverview';
import { RecruitmentAnalyticsDetail } from './RecruitmentAnalyticsDetail';
import { RecruitmentAnalyticsCompare } from './RecruitmentAnalyticsCompare';
import s from './recruitment-analytics.module.css';

const EMPTY_FILTERS: RecruitmentAnalysisFilters = {};
const PEOPLE_LIMIT = 25;
const ANALYSIS_PATH = '/recruitment/analysis';
const COMPARE_PATH = `${ANALYSIS_PATH}/compare`;
type DrillSelection = { kind: 'stage' | 'follow_up'; value: RecruitmentStage | RecruitmentFollowUp; cohortId?: string };

const STAGES: { key: RecruitmentStage; metric: keyof RecruitmentAnalysis['summary']; label: string; definition: string }[] = [
  { key: 'registrant', metric: 'registrants', label: 'Registrants', definition: 'People registered for a recruitment cohort.' },
  { key: 'attendee', metric: 'attendees', label: 'Attendees', definition: 'Registrants with recorded attendance.' },
  { key: 'test_participant', metric: 'test_participants', label: 'Test participants', definition: 'Registrants who attempted a cohort test.' },
  { key: 'test_pass', metric: 'test_passes', label: 'Test passes', definition: 'Registrants who met the test passing requirement.' },
  { key: 'course_completion', metric: 'course_completions', label: 'Course completions', definition: 'Registrants recorded as completing an Academy course.' },
  { key: 'approved_upgrade', metric: 'approved_upgrades', label: 'Associate Pro upgrades', definition: 'Registrants whose Associate Pro upgrade was approved.' },
  { key: 'active_associate_pro', metric: 'active_associate_pros', label: 'Active Associate Pros', definition: 'Approved Associate Pros with a confirmed sale or a later approved recruit.' },
];

const FOLLOW_UPS: { key: RecruitmentFollowUp; label: string; from: RecruitmentStage; to: RecruitmentStage }[] = [
  { key: 'registered_without_attendance', label: 'Registered, no attendance', from: 'registrant', to: 'attendee' },
  { key: 'attended_without_test_attempt', label: 'Attended, no test attempt', from: 'attendee', to: 'test_participant' },
  { key: 'passed_without_course_completion', label: 'Passed, course not completed', from: 'test_pass', to: 'course_completion' },
  { key: 'completed_without_approved_upgrade', label: 'Completed, not upgraded', from: 'course_completion', to: 'approved_upgrade' },
  { key: 'attempted_without_test_pass', label: 'Took the test, didn’t pass', from: 'test_participant', to: 'test_pass' },
  { key: 'passed_without_approved_upgrade', label: 'Passed, not upgraded to Pro', from: 'test_pass', to: 'approved_upgrade' },
  { key: 'approved_without_confirmed_sale', label: 'Pros who haven’t sold yet', from: 'approved_upgrade', to: 'active_associate_pro' },
];

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Update time unavailable';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(date);
}

function useAnalysisFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const programmeId = searchParams.get('programme_id') ?? undefined;
  const cohortId = searchParams.get('cohort_id') ?? undefined;
  const source = searchParams.get('source') ?? undefined;
  const filters = useMemo<RecruitmentAnalysisFilters>(() => ({
    programme_id: programmeId,
    cohort_id: cohortId,
    source,
  }), [programmeId, cohortId, source]);

  const update = (changes: Record<string, string | null>, destination?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('period');
    params.delete('cohort_started_from');
    params.delete('cohort_started_to');
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (!('people_page' in changes)) params.delete('people_page');
    if (!('cohort_page' in changes)) params.delete('cohort_page');
    const query = params.toString();
    const target = destination ?? pathname;
    const href = query ? `${target}?${query}` : target;
    if (destination) router.push(href);
    else router.replace(href, { scroll: false });
  };

  return { filters, programmeId, cohortId, source, update };
}

function PeopleDialog({
  open,
  onOpenChange,
  selection,
  setSelection,
  filters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: DrillSelection | null;
  setSelection: (selection: DrillSelection | null) => void;
  filters: RecruitmentAnalysisFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('people_page')) || 1;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const exportPeople = useRecruitmentPeopleExport();
  const coverage = useRecruitmentAnalysis(filters);
  const people = useRecruitmentAnalysisPeople({
    filters,
    stage: selection?.kind === 'stage' ? selection.value as RecruitmentStage : undefined,
    followUp: selection?.kind === 'follow_up' ? selection.value as RecruitmentFollowUp : undefined,
    page,
    limit: PEOPLE_LIMIT,
    search: debouncedSearch,
  });
  const selectionToken = selection ? `${selection.kind}:${selection.value}` : '';
  const title = selection?.kind === 'stage'
    ? STAGES.find((stage) => stage.key === selection.value)?.label ?? 'People'
    : FOLLOW_UPS.find((item) => item.key === selection?.value)?.label ?? 'Follow-up';
  const cohortName = selection?.cohortId ? people.data?.items[0]?.cohort_name : undefined;
  const canExport = selection?.kind === 'follow_up' && Boolean(filters.cohort_id)
    && coverage.data?.follow_up[selection.value as RecruitmentFollowUp]?.available
    && !people.isFetching && !people.error && search === debouncedSearch && (people.data?.meta.total ?? 0) > 0;
  const downloadPeople = async () => {
    if (!canExport || selection?.kind !== 'follow_up' || exportPeople.isPending) return;
    try {
      const count = await exportPeople.mutateAsync({ filters, followUp: selection.value as RecruitmentFollowUp, search: debouncedSearch, label: title, expectedTotal: people.data!.meta.total! });
      toast.success(`Downloaded ${count.toLocaleString()} people.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(error instanceof Error ? error.message : 'Unable to download this follow-up list.');
    }
  };

  const updatePeoplePage = (nextPage: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage) params.set('people_page', nextPage);
    else params.delete('people_page');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const changeSelection = (value: string) => {
    const [kind, selectionValue] = value.split(':');
    const next: DrillSelection | null = kind === 'stage' && RecruitmentStageSchema.safeParse(selectionValue).success
      ? { kind: 'stage', value: selectionValue as RecruitmentStage, cohortId: selection?.cohortId }
      : kind === 'follow_up' && RecruitmentFollowUpSchema.safeParse(selectionValue).success
        ? { kind: 'follow_up', value: selectionValue as RecruitmentFollowUp, cohortId: selection?.cohortId }
        : null;
    setSelection(next);
    setSearch('');
    updatePeoplePage(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) setSearch(''); }}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><DialogTitle className="text-lg">{title}</DialogTitle><DialogDescription className="mt-1 text-xs">People counted in this group{cohortName ? ` · ${cohortName}` : ''}. Filters follow the dashboard selection.</DialogDescription></div>
            <Select value={selectionToken} onValueChange={changeSelection} disabled={exportPeople.isPending}>
              <SelectTrigger className="w-full sm:w-[230px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => <SelectItem key={`stage:${stage.key}`} value={`stage:${stage.key}`}>{stage.label}</SelectItem>)}
                {FOLLOW_UPS.filter(item => coverage.data?.follow_up[item.key]?.available || selection?.value === item.key).map((item) => <SelectItem key={`follow_up:${item.key}`} value={`follow_up:${item.key}`}>Follow-up: {item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} disabled={exportPeople.isPending} onChange={(event) => { setSearch(event.target.value); updatePeoplePage(null); }} placeholder="Search name, email or cohort" aria-label="Search people" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          {selection?.kind === 'follow_up' && <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Download all {people.data?.meta.total?.toLocaleString() ?? 'matching'} people{search ? ' matching this search' : ' in this group'}. Phone numbers appear when available.</p><div className="flex items-center gap-2">{exportPeople.isPending && <Button variant="ghost" size="sm" onClick={exportPeople.cancel}>Cancel</Button>}<Button size="sm" disabled={!canExport || exportPeople.isPending} onClick={() => void downloadPeople()}>{exportPeople.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{exportPeople.isPending ? 'Preparing CSV…' : 'Download CSV'}</Button></div></div>}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto px-5 sm:px-6">
          {people.isLoading ? <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading people…</div> : people.error ? <p className="py-12 text-center text-sm text-red-600">{people.error.message}</p> : people.data?.items.length ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[690px] border-collapse text-left text-xs"><thead className="sticky top-0 bg-white"><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><th className="py-3 pr-3">Person</th><th className="px-3 py-3">Cohort</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Furthest stage</th><th className="py-3 pl-3">Follow-up</th></tr></thead><tbody>{people.data.items.map((person) => <tr key={person.id} className="border-b border-slate-50 last:border-0"><td className="py-3 pr-3"><b className="text-slate-800">{person.first_name} {person.last_name}</b><span className="mt-1 block text-[10px] text-slate-400">{person.email}</span></td><td className="px-3 py-3 text-slate-600">{person.cohort_name}</td><td className="px-3 py-3 text-slate-600">{person.source ?? 'Unattributed'}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] ${person.classification === 'acquired' ? 'bg-emerald-50 text-emerald-800' : person.classification === 'influenced' ? 'bg-sky-50 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>{person.classification === 'acquired' ? 'New recruit' : person.classification === 'influenced' ? 'Existing user' : 'Unclassified'}</span></td><td className="px-3 py-3 text-slate-600">{STAGES.find((stage) => stage.key === person.furthest_stage)?.label ?? person.furthest_stage}</td><td className="py-3 pl-3 text-slate-500">{person.stalled_days !== null ? `Stalled ${person.stalled_days} days` : '—'}</td></tr>)}</tbody></table></div>
          ) : <div className="py-14 text-center text-sm text-slate-400">No people match this selection.</div>}
        </div>
        <div className="shrink-0 border-t border-slate-100 px-5 sm:px-6">
          <p className="pt-3 text-[10px] text-slate-400">Analysis only. Manage applicants in the existing programme, event, test, and course pages.</p>
          {people.data?.meta.total ? <Pagination count={people.data.meta.total} currentIdx={page} limit={PEOPLE_LIMIT} pageParam="people_page" /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}


const positivePage = (value: string | null) => {
  const number = Number(value ?? 1);
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
};

export function RecruitmentAnalysisPage({ mode = 'overview' }: { mode?: 'overview' | 'compare' }) {
  const searchParams = useSearchParams();
  const { filters, programmeId, cohortId, source, update } = useAnalysisFilters();
  const [drill, setDrill] = useState<DrillSelection | null>(null);
  const optionsQuery = useRecruitmentAnalysis(EMPTY_FILTERS);
  const dashboard = useRecruitmentAnalysis(filters);
  const data = dashboard.data;
  const options = optionsQuery.data?.filter_options ?? data?.filter_options;
  const detailId = mode === 'compare' ? undefined : searchParams.get('detail') ?? cohortId;
  const view = mode === 'compare' ? 'compare' : detailId ? 'detail' : searchParams.get('view') === 'compare' ? 'compare' : 'overview';
  const selected = Array.from(new Set((searchParams.get('compare') ?? '').split(',').filter(Boolean)))
    .filter(id => !options || options.cohorts.some(c => c.id === id)).slice(0, 4);
  const statusParam = searchParams.get('status');
  const status = statusParam === 'registration_open' || statusParam === 'registration_closed' ? statusParam : 'all';
  const sortParam = searchParams.get('cohort_sort');
  const sort = sortParam === 'registrants' || sortParam === 'upgrades' ? sortParam : 'newest';
  const onSelect = (id: string) => update({ compare: (selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id].slice(0, 4)).join(',') });
  const onOpen = (id: string) => update({ view: null, detail: id, cohort_id: null, pro_page: null, pro_search: null }, ANALYSIS_PATH);
  const openCompare = (ids = selected) => update({ view: null, detail: null, cohort_id: null, compare: ids.join(',') }, COMPARE_PATH);
  const onDrill = (kind: DrillSelection['kind'], value: DrillSelection['value'], id: string) => {
    setDrill({ kind, value, cohortId: id });
    update({ people_page: '1' });
  };
  const overview = () => update({ view: null, detail: null, cohort_id: null }, ANALYSIS_PATH);

  return <div className={s.page}><div className={s.content}>
    <nav className={s.nav} aria-label="Recruitment analytics pages"><span className={s.eyebrow}>Associates · Recruitment</span><div className={s.tabs}><button aria-current={view === 'overview' ? 'page' : undefined} onClick={overview}>Overview</button><button aria-current={view === 'compare' ? 'page' : undefined} onClick={() => openCompare()}>Compare</button></div></nav>
    {view === 'overview' && <>
      <header className={s.heading}><div><h1>Recruitment Analytics</h1><p className={s.subtitle}>Every cohort, from registration to sales. Open a cohort or select a few to compare.</p></div><button className={s.button} disabled={dashboard.isFetching} onClick={() => { void dashboard.refetch(); void optionsQuery.refetch(); }}><RefreshCw size={14} className={dashboard.isFetching ? 'animate-spin' : undefined} />Refresh</button></header>
      {options && <AnalyticsFilters options={options} programmeId={programmeId} source={source} status={status} update={update} />}
      {dashboard.isLoading ? <div className={s.empty}><Loader2 className="animate-spin" />Loading recruitment analytics…</div> : dashboard.error ? <div role="alert" className={s.error}>{dashboard.error.message}<button className={s.link} onClick={() => void dashboard.refetch()}> Try again</button></div> : data ? <RecruitmentAnalyticsOverview data={data} status={status} search={searchParams.get('cohort_search') ?? ''} sort={sort} page={positivePage(searchParams.get('cohort_page'))} selected={selected} update={update} onSelect={onSelect} onCompare={() => openCompare()} onOpen={onOpen} /> : null}
      <p className={s.muted}>Updated {data ? formatUpdatedAt(data.generated_at) : '—'}</p>
    </>}
    {view === 'detail' && detailId && <RecruitmentAnalyticsDetail key={detailId} cohortId={detailId} filters={{ source }} onBack={overview} onCompare={() => openCompare(Array.from(new Set([detailId, ...selected])).slice(0, 4))} onDrill={onDrill} proPage={positivePage(searchParams.get('pro_page'))} proSearch={searchParams.get('pro_search') ?? ''} update={update} />}
    {view === 'compare' && (options ? <RecruitmentAnalyticsCompare options={options.cohorts} selected={selected} source={source} onChange={ids => update({ compare: ids.join(',') })} onOpen={onOpen} /> : optionsQuery.error ? <div role="alert" className={s.error}>Unable to load cohort options. <button className={s.link} onClick={() => void optionsQuery.refetch()}>Try again</button></div> : <div className={s.empty}>Loading cohorts…</div>)}
    {drill && <PeopleDialog open onOpenChange={open => { if (!open) { setDrill(null); update({ people_page: null }); } }} selection={drill} setSelection={setDrill} filters={{ source, cohort_id: drill.cohortId }} />}
  </div></div>;
}

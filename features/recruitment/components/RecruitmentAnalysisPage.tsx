'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { RecruitmentFollowUpSchema, RecruitmentStageSchema, type RecruitmentAnalysis, type RecruitmentFollowUp, type RecruitmentStage } from '../schemas/recruitment-analysis.schema';
import { useRecruitmentAnalysis, useRecruitmentAnalysisPeople, type RecruitmentAnalysisFilters } from '../hooks/use-recruitment';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalysisToolbar, AttendanceNotice, BusinessSummary, CohortExplorer, RecruitmentJourney, type CohortSort } from './RecruitmentAnalysisDashboard';
import { cohortStage } from './analysis-presentation';
import { RecruitmentCohortDrawer } from './RecruitmentCohortDrawer';

const EMPTY_FILTERS: RecruitmentAnalysisFilters = {};
const PEOPLE_LIMIT = 25;
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

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('period');
    params.delete('cohort_started_from');
    params.delete('cohort_started_to');
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete('people_page');
    if (!('cohort_page' in changes)) params.delete('cohort_page');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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
            <Select value={selectionToken} onValueChange={changeSelection}>
              <SelectTrigger className="w-full sm:w-[230px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => <SelectItem key={`stage:${stage.key}`} value={`stage:${stage.key}`}>{stage.label}</SelectItem>)}
                {FOLLOW_UPS.map((item) => <SelectItem key={`follow_up:${item.key}`} value={`follow_up:${item.key}`}>Follow-up: {item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); updatePeoplePage(null); }} placeholder="Search name, email or cohort" aria-label="Search people" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
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


export function RecruitmentAnalysisPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, programmeId, cohortId, source, update } = useAnalysisFilters();
  const [drillOpen, setDrillOpen] = useState(false);
  const [drawerCohortId, setDrawerCohortId] = useState<string | null>(null);
  const [drill, setDrill] = useState<DrillSelection | null>(null);
  const optionsQuery = useRecruitmentAnalysis(EMPTY_FILTERS);
  const dashboard = useRecruitmentAnalysis(filters);
  const data = dashboard.data;
  const drawerCohort = data?.cohorts.find(cohort => cohort.id === drawerCohortId);
  const options = optionsQuery.data?.filter_options ?? data?.filter_options;
  const stage = searchParams.get('cohort_stage') ?? 'all';
  const metric = searchParams.get('judge_by') === 'selling' ? 'selling' : 'upgrades';
  const sortParam = searchParams.get('cohort_sort') ?? 'registrants';
  const sort: CohortSort = ['name', 'programme', 'started', 'stage', 'registrants', 'upgrades', 'selling', 'comparison'].includes(sortParam) ? sortParam as CohortSort : 'registrants';
  const direction = searchParams.get('cohort_direction') === 'asc' ? 'asc' : 'desc';
  const pageParam = Number(searchParams.get('cohort_page') ?? 1);
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const stages = Array.from(new Set((data?.cohorts ?? []).map(cohortStage))).sort();

  const openStage = (value: RecruitmentStage, scopedCohortId?: string) => {
    setDrill({ kind: 'stage', value, cohortId: scopedCohortId });
    setDrillOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('people_page', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const refresh = () => { void dashboard.refetch(); void optionsQuery.refetch(); };
  const closePeople = (open: boolean) => {
    setDrillOpen(open);
    if (!open) {
      setDrill(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('people_page');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-3 pb-16 pt-4 sm:px-5 lg:px-7">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Associates · Recruitment</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Recruitment Analysis</h1></div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500"><span>Updated {data ? formatUpdatedAt(data.generated_at) : '—'}</span><Button variant="outline" size="sm" onClick={refresh} disabled={dashboard.isFetching}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${dashboard.isFetching ? 'animate-spin' : ''}`} />Refresh</Button></div>
      </header>
      {options ? <AnalysisToolbar options={options} programmeId={programmeId} cohortId={cohortId} source={source} stage={stage} stages={stages} metric={metric} update={update} /> : null}
      {dashboard.isLoading && !data ? <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading recruitment analysis…</div> : dashboard.error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{dashboard.error.message || 'Unable to load recruitment analysis.'}<Button variant="link" onClick={refresh} className="text-red-800">Try again</Button></div> : data ? <>
        <BusinessSummary data={data} />
        <AttendanceNotice data={data} onOpen={openStage} />
        <RecruitmentJourney data={data} onOpen={openStage} />
        <CohortExplorer data={data} stage={stage} metric={metric} search={searchParams.get('cohort_search') ?? ''} sort={sort} direction={direction} page={page} update={update} onOpenCohort={setDrawerCohortId} />
      </> : null}
      {drawerCohort ? <RecruitmentCohortDrawer key={drawerCohort.id} cohort={drawerCohort} filters={filters} onClose={() => setDrawerCohortId(null)} onOpenPeople={openStage} /> : null}
      {drill ? <PeopleDialog open={drillOpen} onOpenChange={closePeople} selection={drill} setSelection={setDrill} filters={{ ...filters, cohort_id: drill.cohortId ?? filters.cohort_id }} /> : null}
    </div>
  );
}

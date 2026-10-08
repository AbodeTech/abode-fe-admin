'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHasPermission } from '@/hooks/use-admin-permission';
import { useFinancePostings, useFinanceRuns } from '../hooks/use-finance';
import { PostingFiltersSchema, RunStatusSchema } from '../schemas/finance.schema';
import { RunDetails } from './RunDetails';
import { StartRunDialog } from './StartRunDialog';

function Status({ value }: { value: string }) {
  const color = ['completed', 'posted'].includes(value) ? 'bg-emerald-50 text-emerald-800' : value === 'failed' ? 'bg-red-50 text-red-800' : value === 'flagged' ? 'bg-amber-50 text-amber-800' : 'bg-muted text-muted-foreground';
  return <span className={`inline-block rounded px-2 py-1 text-xs font-medium capitalize ${color}`}>{value}</span>;
}

export function ExpenseAutomation() {
  const router = useRouter();
  const params = useSearchParams();
  const canView = useHasPermission('view_finance_runs');
  const canRun = useHasPermission('run_finance_posting');
  const [newRun, setNewRun] = useState(false);
  const tab = params.get('tab') === 'ledger' ? 'ledger' : 'runs';
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const status = RunStatusSchema.safeParse(params.get('status'));
  const postingStatus = PostingFiltersSchema.shape.posting_status.safeParse(params.get('posting_status'));
  const sheet = params.get('spreadsheet_id') ?? '';
  const gidText = params.get('sheet_gid') ?? '';
  const gid = gidText !== '' && Number.isSafeInteger(Number(gidText)) && Number(gidText) >= 0 ? Number(gidText) : undefined;
  const runId = params.get('run') ?? '';
  const runs = useFinanceRuns({ page, limit: 20, status: status.success ? status.data : undefined }, canView && tab === 'runs');
  const postings = useFinancePostings({ page, limit: 20, posting_status: postingStatus.success ? postingStatus.data : undefined, spreadsheet_id: sheet || undefined, sheet_gid: gid }, canView && tab === 'ledger');
  const active = tab === 'runs' ? runs : postings;
  const meta = active.data?.meta;
  function update(values: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) { if (value) next.set(key, value); else next.delete(key); }
    router.replace(`?${next.toString()}`, { scroll: false });
  }
  if (!canView) return <div className="p-6"><h1 className="text-2xl font-bold">Finance Automation</h1><p className="mt-3 text-muted-foreground">You need permission to view finance runs. Contact your administrator for access.</p></div>;
  return <div className="space-y-6 py-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Finance Automation</h1><p className="mt-1 text-muted-foreground">Review expense runs and track journals sent to Zoho Books.</p></div>{canRun && <Button onClick={() => setNewRun(true)}><Plus className="mr-2 size-4" />New expense run</Button>}</div>
    <div className="rounded-lg border bg-muted/30 p-4 text-sm"><p className="font-medium">Preview before posting</p><p className="mt-1 text-muted-foreground">Start with a dry run. Live runs create journals in the server-configured Zoho organization. Completed runs can still contain flagged or failed expenses.</p></div>
    <div className="flex gap-5 border-b" role="tablist" aria-label="Finance automation views">{(['runs', 'ledger'] as const).map(value => <button key={value} role="tab" aria-selected={tab === value} className={`border-b-2 px-1 pb-3 text-sm ${tab === value ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground'}`} onClick={() => update({ tab: value, page: null, status: null, posting_status: null })}>{value === 'runs' ? 'Expense runs' : 'Posting ledger'}</button>)}</div>
    <section className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4"><h2 className="font-semibold">{tab === 'runs' ? 'Expense runs' : 'Posting ledger'}</h2><div className="flex items-center gap-2"><select aria-label="Status filter" className="h-9 rounded-md border bg-background px-3 text-sm" value={tab === 'runs' ? (status.success ? status.data : '') : (postingStatus.success ? postingStatus.data ?? '' : '')} onChange={e => update({ [tab === 'runs' ? 'status' : 'posting_status']: e.target.value, page: null })}><option value="">All statuses</option>{(tab === 'runs' ? ['queued', 'running', 'completed', 'failed'] : ['posting', 'posted', 'flagged', 'failed']).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select><Button variant="outline" size="sm" disabled={active.isFetching} onClick={() => active.refetch()}><RefreshCw className={`mr-2 size-4 ${active.isFetching ? 'animate-spin' : ''}`} />Refresh</Button></div></div>
      {tab === 'ledger' && <form key={`${sheet}:${gidText}`} className="flex flex-wrap items-end gap-3 border-t p-4" onSubmit={e => { e.preventDefault(); const values = new FormData(e.currentTarget); update({ spreadsheet_id: String(values.get('sheet') ?? '').trim(), sheet_gid: String(values.get('gid') ?? ''), page: null }); }}><label className="flex-1 space-y-1 text-xs">Spreadsheet ID<Input name="sheet" defaultValue={sheet} placeholder="All spreadsheets" /></label><label className="w-32 space-y-1 text-xs">Tab ID<Input name="gid" type="number" min="0" step="1" defaultValue={gidText} placeholder="All tabs" /></label><Button variant="outline" type="submit">Apply filters</Button>{(sheet || gidText) && <Button type="button" variant="ghost" onClick={() => update({ spreadsheet_id: null, sheet_gid: null, page: null })}>Clear</Button>}</form>}
      {active.isLoading ? <div className="flex items-center justify-center gap-2 p-12" role="status"><Loader2 className="size-5 animate-spin" />Loading {tab === 'runs' ? 'runs' : 'postings'}…</div> : active.isError ? <div role="alert" className="space-y-3 p-6"><p className="text-destructive">{active.error.message}</p><Button variant="outline" onClick={() => active.refetch()}>Try again</Button></div> : !active.data?.items.length ? <div className="space-y-2 p-12 text-center"><h3 className="font-medium">{tab === 'runs' ? 'No expense runs found' : 'No posting records found'}</h3><p className="text-sm text-muted-foreground">{tab === 'runs' ? 'Create a dry run or adjust the status filter.' : 'Adjust the filters. Dry runs do not create posting ledger records.'}</p></div> : <div className="overflow-x-auto">
        {tab === 'runs' ? <table className="w-full text-left text-sm"><thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr>{['Created', 'Type', 'Status', 'Result', 'Requested by', ''].map((label, i) => <th key={i} className="p-4 font-medium">{label}</th>)}</tr></thead><tbody>{runs.data?.items.map(run => <tr key={run.run_id} className="border-b last:border-0"><td className="whitespace-nowrap p-4"><p>{new Date(run.createdAt).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Tab {run.params.sheetGid} · from {run.params.startDate}</p></td><td className="whitespace-nowrap p-4">{run.params.dryRun ? 'Dry run' : 'Live'}</td><td className="p-4"><Status value={run.status} /></td><td className="min-w-52 p-4 text-xs">{run.summary ? `${run.summary.posted} ${run.params.dryRun ? 'would post' : 'posted'} · ${run.summary.flagged} flagged · ${run.summary.failed} failed` : run.error ?? (run.status === 'queued' ? 'Awaiting worker' : 'Processing expenses')}</td><td className="p-4 text-xs">{run.requested_by_email ?? '—'}</td><td className="p-4"><Button size="sm" variant="outline" onClick={() => update({ run: run.run_id })}>View run</Button></td></tr>)}</tbody></table> : <table className="w-full text-left text-sm"><thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr>{['Source row', 'Date', 'Debit account', 'Amount', 'Status', 'Journal / issue'].map(label => <th key={label} className="whitespace-nowrap p-4 font-medium">{label}</th>)}</tr></thead><tbody>{postings.data?.items.map((posting, index) => <tr key={`${posting.row_number}-${posting.journal_id}-${index}`} className="border-b last:border-0"><td className="p-4">{posting.row_number}</td><td className="whitespace-nowrap p-4">{posting.journal_date ?? '—'}</td><td className="p-4">{posting.debit_account_name ?? '—'}</td><td className="whitespace-nowrap p-4">{posting.amount?.toLocaleString() ?? '—'}</td><td className="p-4"><Status value={posting.status} /></td><td className="max-w-sm break-words p-4 text-xs">{posting.error || posting.journal_id || posting.posting_status || '—'}{posting.reference_number && <p className="mt-1 text-muted-foreground">Reference: {posting.reference_number}</p>}</td></tr>)}</tbody></table>}
      </div>}
      {!active.isError && <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-xs text-muted-foreground"><span>{meta?.total ?? 0} records · Page {page} of {Math.max(1, meta?.totalPages ?? 1)}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || active.isFetching} onClick={() => update({ page: String(page - 1) })}>Previous</Button><Button variant="outline" size="sm" disabled={page >= (meta?.totalPages ?? 1) || active.isFetching} onClick={() => update({ page: String(page + 1) })}>Next</Button></div></div>}
    </section>
    {tab === 'ledger' && <p className="text-xs text-muted-foreground">Use spreadsheet and tab filters to identify source rows. “Posting” may indicate an interrupted run; verify Zoho before recovery.</p>}
    {canRun && <StartRunDialog open={newRun} onOpenChange={setNewRun} onQueued={id => update({ tab: 'runs', status: null, page: null, run: id })} />}
    <RunDetails id={runId} canView={canView} onClose={() => { update({ run: null }); void active.refetch(); }} />
  </div>;
}

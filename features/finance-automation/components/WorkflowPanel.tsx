'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHasPermission } from '@/hooks/use-admin-permission';
import { useWorkflowPostings, useWorkflowRuns } from '../hooks/use-workflows';
import { RunStatusSchema } from '../schemas/finance.schema';
import { WorkflowFiltersSchema, workflows, type Workflow } from '../schemas/workflows.schema';
import { WorkflowForm } from './WorkflowForm';
import { ResultFields, WorkflowResults } from './WorkflowResults';

export function WorkflowPanel({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const params = useSearchParams();
  const canView = useHasPermission('view_finance_runs');
  const canPost = useHasPermission('run_finance_posting');
  const canReport = useHasPermission('run_finance_reports');
  const [newRun, setNewRun] = useState(false);
  const report = workflow === 'revenue' || workflow === 'expenseReport';
  const ledger = !report && params.get('tab') === 'ledger';
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const status = RunStatusSchema.safeParse(params.get('status'));
  const postingStatus = WorkflowFiltersSchema.shape.posting_status.safeParse(params.get('posting_status'));
  const kind = WorkflowFiltersSchema.shape.kind.safeParse(params.get('kind'));
  const handler = WorkflowFiltersSchema.shape.handler.safeParse(params.get('handler'));
  const rawGid = params.get('sheet_gid');
  const filters = {
    page, limit: 20, status: status.success ? status.data : undefined,
    posting_status: postingStatus.success ? postingStatus.data : undefined,
    spreadsheet_id: params.get('spreadsheet_id') || undefined,
    sheet_gid: rawGid !== null && rawGid !== '' && Number.isSafeInteger(Number(rawGid)) && Number(rawGid) >= 0 ? Number(rawGid) : undefined,
    kind: kind.success ? kind.data : undefined, handler: handler.success ? handler.data : undefined,
    bank_key: params.get('bank_key') || undefined,
  };
  const runs = useWorkflowRuns(workflow, filters, canView && !ledger);
  const postings = useWorkflowPostings(workflow, filters, canView && ledger);
  const active = ledger ? postings : runs;
  const meta = active.data?.meta;
  function update(values: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) { if (value) next.set(key, value); else next.delete(key); }
    router.replace(`?${next.toString()}`, { scroll: false });
  }
  if (!canView) return <p className="py-6">You need permission to view finance runs.</p>;
  return <div className="space-y-5 py-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{workflows[workflow].label}</h1><p className="mt-1 text-muted-foreground">{report ? 'Preview report figures and update Google Sheets.' : workflow === 'income' ? 'Post bank income to Zoho and review invoices, payments and exceptions.' : 'Post commissions, withholding tax and withdrawals to Zoho.'}</p></div>{(report ? canReport : canPost) && <Button onClick={() => setNewRun(true)}>New {workflows[workflow].label.toLowerCase()} run</Button>}</div>
    <p className="rounded-lg border bg-muted/30 p-4 text-sm">Runs default to preview only. Review the dry-run results before choosing a live run. A completed run can still contain exceptions.</p>
    {!report && <div className="flex gap-2"><Button variant={!ledger ? 'default' : 'outline'} onClick={() => update({ tab: 'runs', page: null, status: null, posting_status: null })}>Runs</Button><Button variant={ledger ? 'default' : 'outline'} onClick={() => update({ tab: 'ledger', page: null, status: null, posting_status: null })}>Posting ledger</Button></div>}
    <section className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4"><h2 className="font-semibold">{ledger ? 'Posting ledger' : 'Run history'}</h2><div className="flex gap-2">{!report && <select aria-label="Status filter" className="rounded-md border bg-background px-3 text-sm" value={(ledger ? filters.posting_status : filters.status) ?? ''} onChange={e => update({ [ledger ? 'posting_status' : 'status']: e.target.value, page: null })}><option value="">All statuses</option>{(ledger ? ['posting', 'posted', 'failed', workflow === 'income' ? 'review' : 'flagged'] : ['queued', 'running', 'completed', 'failed']).map(value => <option key={value}>{value}</option>)}</select>}<Button variant="outline" disabled={active.isFetching} onClick={() => active.refetch()}>Refresh</Button></div></div>
      {ledger && <form key={params.toString()} className="flex flex-wrap items-end gap-3 border-t p-4" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); update({ spreadsheet_id: String(data.get('spreadsheet_id') ?? '').trim(), sheet_gid: String(data.get('sheet_gid') ?? ''), bank_key: String(data.get('bank_key') ?? '').trim(), kind: String(data.get('kind') ?? ''), handler: String(data.get('handler') ?? ''), page: null }); }}>
        <label className="space-y-1 text-xs">Spreadsheet ID<Input name="spreadsheet_id" defaultValue={filters.spreadsheet_id} placeholder="All spreadsheets" /></label>
        <label className="space-y-1 text-xs">Tab ID<Input name="sheet_gid" type="number" min={0} step={1} defaultValue={filters.sheet_gid} placeholder="All tabs" /></label>
        {workflow === 'income' ? <><label className="space-y-1 text-xs">Bank key<Input name="bank_key" defaultValue={filters.bank_key} placeholder="All banks" /></label><label className="space-y-1 text-xs">Handler<select name="handler" defaultValue={filters.handler ?? ''} className="block h-9 rounded border bg-background px-2"><option value="">All handlers</option>{['new_sale', 'continuing', 'ass_pro', 'dev_levy'].map(value => <option key={value}>{value}</option>)}</select></label></> : <label className="space-y-1 text-xs">Payout type<select name="kind" defaultValue={filters.kind ?? ''} className="block h-9 rounded border bg-background px-2"><option value="">All payout types</option>{['commission', 'wht', 'withdrawal'].map(value => <option key={value}>{value}</option>)}</select></label>}
        <Button type="submit" variant="outline">Apply filters</Button><Button type="button" variant="ghost" onClick={() => update({ spreadsheet_id: null, sheet_gid: null, bank_key: null, kind: null, handler: null, page: null })}>Clear</Button>
      </form>}
      {active.isLoading ? <p role="status" className="p-8">Loading…</p> : active.isError ? <div role="alert" className="space-y-2 p-6"><p className="text-destructive">{active.error.message}</p><Button variant="outline" onClick={() => active.refetch()}>Try again</Button></div> : !active.data?.items.length ? <p className="p-8 text-center text-muted-foreground">{ledger ? 'No posting records match these filters. Dry runs do not create ledger records.' : 'No runs found. Start a dry run to preview the results.'}</p> : ledger ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y bg-muted/30"><tr>{['Row', 'Name / client', 'Amount', 'Status', 'Details'].map(title => <th key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{postings.data?.items.map((entry, index) => <tr key={index} className="border-b"><td className="p-3">{entry.row_number}</td><td className="p-3">{'client' in entry ? entry.client : 'name' in entry ? entry.name : '—'}</td><td className="p-3">{entry.amount?.toLocaleString() ?? '—'}</td><td className="p-3"><p className="capitalize">{entry.status}</p><p className="text-xs text-muted-foreground">{entry.posting_status}</p></td><td className="p-3"><details><summary className="cursor-pointer">Records and issues</summary><div className="min-w-80 py-3"><ResultFields value={entry} /></div></details></td></tr>)}</tbody></table></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y bg-muted/30"><tr>{['Created', 'Type', 'Status', 'Result', 'Requested by', ''].map((title, index) => <th key={index} className="p-3">{title}</th>)}</tr></thead><tbody>{runs.data?.items.map(run => <tr key={run.run_id} className="border-b"><td className="whitespace-nowrap p-3">{new Date(run.createdAt).toLocaleString()}</td><td className="p-3">{run.params.dryRun ? 'Dry run' : 'Live'}{workflow === 'payouts' && <p className="text-xs capitalize">{String(run.params.kind ?? '')}</p>}</td><td className="p-3 capitalize">{run.status}</td><td className="p-3">{run.summary ? report ? `${run.summary.cells_planned ?? '—'} cells planned · ${run.summary.cells_written ?? '—'} written` : `${run.summary.posted ?? '—'} ${run.params.dryRun ? 'would post' : 'posted'} · ${run.summary.reviewed ?? run.summary.flagged ?? '—'} for review · ${run.summary.failed ?? '—'} failed` : run.error ?? (run.status === 'queued' ? 'Awaiting worker' : 'Processing')}</td><td className="p-3">{run.requested_by_email ?? '—'}</td><td className="p-3"><Button variant="outline" size="sm" onClick={() => update({ run: run.run_id })}>View run</Button></td></tr>)}</tbody></table></div>}
      {meta && <div className="flex items-center justify-between gap-3 border-t p-4 text-sm"><span>{meta.total} records · Page {page} of {Math.max(1, meta.totalPages ?? 1)}</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || active.isFetching} onClick={() => update({ page: String(page - 1) })}>Previous</Button><Button variant="outline" disabled={page >= (meta.totalPages ?? 1) || active.isFetching} onClick={() => update({ page: String(page + 1) })}>Next</Button></div></div>}
    </section>
    {newRun && (report ? canReport : canPost) && <WorkflowForm workflow={workflow} onClose={() => setNewRun(false)} onQueued={id => update({ tab: 'runs', status: null, page: null, run: id })} />}
    <WorkflowResults workflow={workflow} id={params.get('run') ?? ''} canView={canView} onClose={() => { update({ run: null }); void active.refetch(); }} />
  </div>;
}

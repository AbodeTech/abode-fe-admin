'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFinanceRun } from '../hooks/use-finance';

export function RunDetails({ id, onClose, canView }: { id: string; onClose: () => void; canView: boolean }) {
  const query = useFinanceRun(id, canView);
  const run = query.data;
  const summary = run?.summary;
  return <Dialog open={!!id} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle>Expense run details</DialogTitle><DialogDescription className="break-all">{id}</DialogDescription></DialogHeader>
    {query.isLoading && <p role="status">Loading run…</p>}
    {query.isError && <div role="alert"><p className="text-destructive">{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button></div>}
    {run && <div className="space-y-5 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><span className="font-medium capitalize">{run.status} · {run.params.dryRun ? 'Dry run' : 'Live posting'}</span><span className="text-muted-foreground">{run.requested_by_email ?? 'Unknown admin'}</span></div>
      {['queued', 'running'].includes(run.status) && <p role="status" className="rounded-lg bg-muted p-3">This run is {run.status}. Its status refreshes automatically.</p>}
      {run.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{run.error}</p>}
      <dl className="grid grid-cols-[110px_1fr] gap-2 break-all"><dt className="text-muted-foreground">Organization</dt><dd>{run.params.organization_id}</dd><dt className="text-muted-foreground">Spreadsheet</dt><dd>{run.params.spreadsheetId}</dd><dt className="text-muted-foreground">Tab / from</dt><dd>{run.params.sheetGid} / {run.params.startDate}</dd><dt className="text-muted-foreground">Limit</dt><dd>{run.params.limit ?? 'No explicit limit'}</dd><dt className="text-muted-foreground">Started</dt><dd>{run.started_at ? new Date(run.started_at).toLocaleString() : 'Not started'}</dd><dt className="text-muted-foreground">Finished</dt><dd>{run.finished_at ? new Date(run.finished_at).toLocaleString() : 'Not finished'}</dd></dl>
      {summary && <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Eligible', summary.eligible], [summary.dry_run ? 'Would post' : 'Posted', summary.posted], ['Flagged', summary.flagged], ['Failed', summary.failed]].map(([label, value]) => <div key={label} className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
        <p className="text-muted-foreground">{summary.rows_on_sheet} source rows · {summary.already_posted} already posted · {summary.rows_not_reached} not reached{summary.limit_reached ? ' · Journal limit reached' : ''}</p>
        {summary.stuck_rows.length > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">Rows {summary.stuck_rows.join(', ')} are stuck mid-post. Check Zoho before attempting recovery; a journal may already exist.</p>}
        {summary.changed_after_posting.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Source changed after posting: rows {summary.changed_after_posting.join(', ')}. Finance should review the existing journals.</p>}
        {Object.entries({ 'Skipped rows': summary.skipped, 'Classification flags': summary.flagged_by_reason, 'Unresolved accounts': summary.unresolved_accounts, 'Mixed account pairs': summary.mixed_pairs }).map(([title, counts]) => Object.values(counts).some(count => count > 0) && <section key={title}><h3 className="mb-2 font-semibold">{title}</h3><ul className="space-y-1 text-muted-foreground">{Object.entries(counts).filter(([, count]) => count > 0).map(([label, count]) => <li key={label}>{label.replaceAll('_', ' ')}: {count}</li>)}</ul></section>)}
        {summary.failures.length > 0 && <section><h3 className="font-semibold">Posting failures</h3><ul className="mt-2 space-y-2 text-destructive">{summary.failures.map((failure, index) => <li key={`${failure.row_number}-${index}`}>Row {failure.row_number}: {failure.reason}</li>)}</ul></section>}
        {summary.journals.length > 0 && <section><h3 className="mb-2 font-semibold">{summary.dry_run ? 'Journal preview' : 'Created journals'}</h3><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Row</th><th className="p-2">Account</th><th className="p-2">Amount</th><th className="p-2">Journal ID</th></tr></thead><tbody>{summary.journals.map((journal, index) => <tr key={`${journal.row_number}-${index}`} className="border-t"><td className="p-2">{journal.row_number}</td><td className="p-2">{journal.debit_account_name}</td><td className="p-2">{journal.amount.toLocaleString()}</td><td className="p-2">{journal.journal_id || '—'}</td></tr>)}</tbody></table></div></section>}
        <section><h3 className="font-semibold">Spreadsheet synchronization</h3><p className="mt-1 text-muted-foreground">{summary.sheet_sync_error ?? (summary.sheet_cells_written === null ? 'No sheet write result for this run.' : `${summary.sheet_cells_written} cells written`)}</p></section>
      </>}
      <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </div>}
  </DialogContent></Dialog>;
}

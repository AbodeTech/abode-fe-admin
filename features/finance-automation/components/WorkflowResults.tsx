'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkflowRun } from '../hooks/use-workflows';
import { workflows, type Workflow } from '../schemas/workflows.schema';

function label(key: string) { return key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' '); }
/** Render every summary field, including nested report metrics and exception rows. */
export function ResultFields({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (typeof value !== 'object') return <span className="break-all">{String(value)}</span>;
  if (Array.isArray(value)) return value.length ? <ul className="space-y-2">{value.map((entry, index) => <li key={index} className="rounded border p-2"><ResultFields value={entry} /></li>)}</ul> : <span className="text-muted-foreground">None</span>;
  return <dl className="space-y-3 text-sm">{Object.entries(value).map(([key, entry]) => <div key={key} className="grid gap-1 sm:grid-cols-[180px_1fr]"><dt className="capitalize text-muted-foreground">{label(key)}</dt><dd className="min-w-0"><ResultFields value={entry} /></dd></div>)}</dl>;
}
export function WorkflowResults({ workflow, id, canView, onClose }: { workflow: Workflow; id: string; canView: boolean; onClose: () => void }) {
  const query = useWorkflowRun(workflow, id, canView);
  const run = query.data;
  return <Dialog open={!!id} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle>{workflows[workflow].label} run details</DialogTitle><DialogDescription className="break-all">{id}</DialogDescription></DialogHeader>
    {query.isLoading && <p role="status">Loading run…</p>}
    {query.isError && <div role="alert"><p className="text-destructive">{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button></div>}
    {run && <div className="space-y-6"><p className="font-medium capitalize">{run.status} · {run.params.dryRun ? 'Dry run' : 'Live run'}</p>
      {['queued', 'running'].includes(run.status) && <p role="status">Status refreshes automatically while this run is active.</p>}
      {run.error && <p role="alert" className="text-destructive">{run.error}</p>}
      <section className="space-y-3"><h3 className="font-semibold">Run configuration</h3><ResultFields value={{ ...run.params, requested_by: run.requested_by_email, started_at: run.started_at, finished_at: run.finished_at }} /></section>
      {run.summary && <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Results and exceptions</h3><ResultFields value={run.summary} /></section>}
    </div>}
    <Button variant="outline" onClick={onClose}>Close</Button>
  </DialogContent></Dialog>;
}

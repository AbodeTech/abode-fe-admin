'use client';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStartWorkflow } from '../hooks/use-workflows';
import { workflows, type Workflow, type WorkflowRequest } from '../schemas/workflows.schema';
import { ResultFields } from './WorkflowResults';

export function WorkflowForm({ workflow, onClose, onQueued }: { workflow: Workflow; onClose: () => void; onQueued: (id: string) => void }) {
  const form = useForm<Record<string, string>>({ defaultValues: { dry_run: 'true', kind: 'commission', audit_mode: 'replace', missing: 'flag' } });
  const mutation = useStartWorkflow(workflow);
  const [review, setReview] = useState<WorkflowRequest | null>(null);
  const submitting = useRef(false);
  const isReport = workflow === 'revenue' || workflow === 'expenseReport';
  const fields: { name: string; label: string; type?: string; optional?: boolean; options?: string[]; help?: string }[] = [
    ...(workflow === 'income' ? [
      { name: 'bank_key', label: 'Bank configuration key', help: 'Use the configured key, e.g. gtbank. The bank configuration supplies the source sheet and Zoho bank account.' },
      { name: 'start_date', label: 'From date', type: 'date' }, { name: 'end_date', label: 'Through date', type: 'date' },
      { name: 'only_row', label: 'Only source row', type: 'number', optional: true },
    ] : [{ name: 'spreadsheet_id', label: 'Spreadsheet ID', help: 'The ID between /d/ and /edit in the Google Sheets URL.' }]),
    ...(workflow === 'payouts' ? [ { name: 'kind', label: 'Payout type', options: ['commission', 'wht', 'withdrawal'] }, { name: 'sheet_gid', label: 'Source tab ID', type: 'number' } ] : []),
    ...(!isReport ? [{ name: 'limit', label: 'Maximum postings', type: 'number', optional: true }] : [
      { name: 'report_gid', label: 'Report tab ID', type: 'number' },
      { name: 'today', label: 'Reporting date', type: 'date', optional: true, help: 'Leave blank to use today in Lagos.' },
    ]),
    ...(workflow === 'revenue' ? [
      { name: 'source_gids', label: 'Bank source tab IDs', help: 'Enter 1–10 tab IDs separated by commas.' },
      { name: 'audit_gid', label: 'Audit tab ID', type: 'number', optional: true },
      { name: 'audit_mode', label: 'Audit sheet behaviour', options: ['replace', 'off'], help: 'Replace rewrites the selected audit tab with unrecognised products.' },
    ] : []),
    ...(workflow === 'expenseReport' ? [{ name: 'missing', label: 'Missing Zoho figures', options: ['flag', 'zero'], help: 'Flag for review, or write zero for missing figures.' }] : []),
  ];
  function prepare(values: Record<string, string>) {
    form.clearErrors();
    const body: Record<string, unknown> = { dry_run: values.dry_run !== 'false' };
    for (const field of fields) {
      const value = (values[field.name] ?? '').trim();
      if (field.optional && !value) continue;
      body[field.name] = field.name === 'source_gids'
        ? value.split(',').map(part => part.trim() === '' ? NaN : Number(part.trim()))
        : field.type === 'number' ? (value === '' ? NaN : Number(value)) : value;
    }
    const result = workflows[workflow].schema.safeParse(body);
    if (!result.success) {
      for (const issue of result.error.issues) form.setError(String(issue.path[0]), { message: issue.message });
      return;
    }
    setReview(result.data);
  }
  async function submit() {
    if (!review || submitting.current) return;
    submitting.current = true;
    try {
      const result = await mutation.mutateAsync(review);
      toast.success(result.dry_run ? 'Dry run queued' : 'Run queued');
      onQueued(result.run_id); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not queue run'); }
    finally { submitting.current = false; }
  }
  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>{review ? 'Review' : 'New'} {workflows[workflow].label.toLowerCase()} run</DialogTitle><DialogDescription>{isReport ? 'Preview the report, then write the results to Google Sheets.' : 'Preview transactions before posting to Zoho Books.'}</DialogDescription></DialogHeader>
    {review ? <div className="space-y-4">
      <ResultFields value={review} />
      <p className="rounded-lg border bg-muted/30 p-4 text-sm">{review.dry_run ? 'Preview only. This run will not create Zoho records or write to the spreadsheet.' : isReport ? 'This run writes to the selected report sheet. Revenue audit replacement can overwrite the audit tab.' : 'This run creates financial records in the configured Zoho organization. Check the organization and results of your dry run before proceeding.'}</p>
      {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message} Check run history before resubmitting if the connection was interrupted.</p>}
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={mutation.isPending} onClick={() => { setReview(null); mutation.reset(); }}>Back</Button><Button disabled={mutation.isPending} onClick={submit}>{mutation.isPending ? 'Queuing…' : review.dry_run ? 'Queue dry run' : isReport ? 'Confirm report write' : 'Confirm live posting'}</Button></div>
    </div> : <Form {...form}><form onSubmit={form.handleSubmit(prepare)} className="space-y-4">
      {fields.map(item => <FormField key={item.name} control={form.control} name={item.name} render={({ field }) => <FormItem><FormLabel>{item.label}{item.optional ? ' (optional)' : ''}</FormLabel><FormControl>{item.options ? <select {...field} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{item.options.map(option => <option key={option} value={option}>{option}</option>)}</select> : <Input {...field} value={field.value ?? ''} type={item.type ?? 'text'} step={item.type === 'number' ? 1 : undefined} />}</FormControl>{item.help && <p className="text-xs text-muted-foreground">{item.help}</p>}<FormMessage /></FormItem>} />)}
      <FormField control={form.control} name="dry_run" render={({ field }) => <FormItem><FormLabel>Run type</FormLabel><FormControl><select {...field} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="true">Dry run — preview only</option><option value="false">{isReport ? 'Live — write report' : 'Live — post to Zoho'}</option></select></FormControl></FormItem>} />
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Review run</Button></div>
    </form></Form>}
  </DialogContent></Dialog>;
}

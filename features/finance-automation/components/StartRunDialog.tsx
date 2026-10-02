'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useStartFinanceRun } from '../hooks/use-finance';
import { StartRunSchema, type StartRun } from '../schemas/finance.schema';

export function StartRunDialog({ open, onOpenChange, onQueued }: {
  open: boolean; onOpenChange: (open: boolean) => void; onQueued: (id: string) => void;
}) {
  const form = useForm<StartRun>({ resolver: zodResolver(StartRunSchema), defaultValues: {
    spreadsheet_id: '', sheet_gid: 0, start_date: '', dry_run: true,
  } });
  const mutation = useStartFinanceRun();
  const [review, setReview] = useState<StartRun | null>(null);
  const submitting = useRef(false);
  async function submit() {
    if (!review || submitting.current) return;
    submitting.current = true;
    try {
      const result = await mutation.mutateAsync(review);
      toast.success(result.dry_run ? 'Dry run queued' : 'Posting run queued');
      setReview(null);
      onOpenChange(false);
      onQueued(result.run_id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not queue this run');
    } finally { submitting.current = false; }
  }
  return <Dialog open={open} onOpenChange={value => { if (!mutation.isPending) { onOpenChange(value); setReview(null); mutation.reset(); } }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{review ? 'Review expense run' : 'New expense run'}</DialogTitle>
        <DialogDescription>{review ? 'Confirm the source and run type before continuing.' : 'Preview spreadsheet expenses before creating journals in Zoho Books.'}</DialogDescription>
      </DialogHeader>
      {review ? <div className="space-y-5">
        <dl className="grid grid-cols-[100px_1fr] gap-3 text-sm">
          <dt className="text-muted-foreground">Spreadsheet</dt><dd className="break-all">{review.spreadsheet_id}</dd>
          <dt className="text-muted-foreground">Tab</dt><dd>{review.sheet_gid}</dd>
          <dt className="text-muted-foreground">From</dt><dd>{review.start_date}</dd>
          <dt className="text-muted-foreground">Limit</dt><dd>{review.limit ?? 'No explicit limit'}</dd>
          <dt className="text-muted-foreground">Type</dt><dd className="font-semibold">{review.dry_run ? 'Dry run' : 'Live posting'}</dd>
        </dl>
        <p className={`rounded-lg border p-4 text-sm ${review.dry_run ? 'bg-muted/40' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {review.dry_run ? 'No journals will be created in Zoho Books.' : 'This creates journals in the server-configured Zoho organization. Check the organization in a previous dry run before posting. A dry run does not lock the spreadsheet or approve a later run.'}
        </p>
        {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message} If the connection was interrupted, check run history before submitting again.</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={mutation.isPending} onClick={() => { setReview(null); mutation.reset(); }}>Back</Button><Button disabled={mutation.isPending} onClick={submit}>{mutation.isPending ? 'Queuing…' : review.dry_run ? 'Queue dry run' : 'Confirm live posting'}</Button></div>
      </div> : <Form {...form}><form onSubmit={form.handleSubmit(setReview)} className="space-y-4">
        <FormField control={form.control} name="spreadsheet_id" render={({ field }) => <FormItem><FormLabel>Spreadsheet ID</FormLabel><FormControl><Input {...field} placeholder="ID between /d/ and /edit in the Sheets URL" /></FormControl><FormMessage /></FormItem>} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="sheet_gid" render={({ field }) => <FormItem><FormLabel>Sheet tab ID</FormLabel><FormControl><Input type="number" min={0} step={1} {...field} onChange={e => field.onChange(e.target.value === '' ? NaN : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="start_date" render={({ field }) => <FormItem><FormLabel>Include expenses from</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
        </div>
        <FormField control={form.control} name="limit" render={({ field }) => <FormItem><FormLabel>Maximum journals (optional)</FormLabel><FormControl><Input type="number" min={1} max={1000} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="dry_run" render={({ field }) => <FormItem><FormLabel>Run type</FormLabel><FormControl><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={field.value ? 'dry' : 'live'} onChange={e => field.onChange(e.target.value === 'dry')}><option value="dry">Dry run — preview only</option><option value="live">Live run — create Zoho journals</option></select></FormControl><FormMessage /></FormItem>} />
        <p className="text-xs text-muted-foreground">The spreadsheet must be shared with the configured Google service account.</p>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Review run</Button></div>
      </form></Form>}
    </DialogContent>
  </Dialog>;
}

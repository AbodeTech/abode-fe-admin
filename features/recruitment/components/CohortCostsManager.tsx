'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2, ReceiptText, Check, ChevronDown, Megaphone, MapPin, Users, Wrench, CircleEllipsis, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAdminPermissions } from '@/hooks/use-admin-permission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { COHORT_COST_LABELS, CohortCostFormSchema, DeleteCohortCostSchema, cohortCostDate, type CohortCostEntry, type CohortCostForm, type DeleteCohortCost } from '../schemas/cohort-cost.schema';
import { useCohortCosts, useCohortCostWrites } from '../hooks/use-cohort-costs';
import type { CohortSummary } from '../schemas/programme.schema';
import { moneyText } from './analytics-performance';

const categoryIcons = { ads: Megaphone, events_venue: MapPin, facilitators: Users, tools_messaging: Wrench, other: CircleEllipsis };
const formattedAmount = (value: string) => {
  const [whole, fraction] = value.split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction !== undefined ? `.${fraction}` : '');
};

function CostEditor({ entry, busy, onSave, onCancel, setup = false, inDialog = false }: { entry?: CohortCostEntry; busy: boolean; onSave: (values: CohortCostForm) => Promise<boolean>; onCancel: () => void; setup?: boolean; inDialog?: boolean }) {
  const [dateOpen, setDateOpen] = useState(false);
  const form = useForm<CohortCostForm>({ resolver: zodResolver(CohortCostFormSchema), defaultValues: {
    category: entry?.category ?? 'ads', amount: entry ? (entry.amount.amount_minor / 100).toFixed(2) : '', description: entry?.description ?? '', incurred_on: cohortCostDate(entry?.incurred_on ?? (setup ? new Date().toISOString() : null)), reason: '',
  } });
  return <Form {...form}><form noValidate className={setup || inDialog ? 'space-y-5' : 'space-y-4 rounded-xl border bg-slate-50 p-4'} onSubmit={event => {
    if (setup && !form.getValues('amount')) { event.preventDefault(); form.setError('amount', { message: 'Enter an amount' }, { shouldFocus: true }); return; }
    void form.handleSubmit(async values => {
      if (setup && Number(values.amount) <= 0) { form.setError('amount', { message: 'Amount must be greater than zero' }, { shouldFocus: true }); return; }
      if (entry && !DeleteCohortCostSchema.safeParse({ reason: values.reason }).success) { form.setError('reason', { message: 'Please give a reason of at least 15 characters' }); return; }
      if (entry?.incurred_on && !values.incurred_on) { form.setError('incurred_on', { message: 'Choose a date. A recorded date cannot be cleared.' }); return; }
      if (await onSave(values) && setup && !entry) {
        form.reset({ category: values.category, amount: '', description: '', incurred_on: cohortCostDate(new Date().toISOString()), reason: '' });
        // Wait for the disabled saving state to clear before restoring focus.
        setTimeout(() => form.setFocus('amount'), 0);
      }
    })(event);
  }}>
    {!inDialog && <h2 className="font-semibold">{entry ? 'Edit cost' : 'Add a cost'}</h2>}
    <fieldset disabled={busy} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="category" render={({ field }) => <FormItem className="min-w-0"><FormLabel>Category</FormLabel><Select value={field.value} onValueChange={field.onChange} disabled={busy}><FormControl><SelectTrigger className="h-10! w-full bg-background"><SelectValue>{COHORT_COST_LABELS[field.value]}</SelectValue></SelectTrigger></FormControl><SelectContent>{Object.entries(COHORT_COST_LABELS).map(([value, label]) => { const Icon = categoryIcons[value as keyof typeof categoryIcons]; return <SelectItem key={value} value={value}><Icon className="size-4" aria-hidden="true" />{label}</SelectItem>; })}</SelectContent></Select><FormMessage aria-live="polite" /></FormItem>} />
        <FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount</FormLabel><div className="relative"><span aria-hidden="true" className="pointer-events-none absolute top-2.5 left-3 text-sm text-slate-600">₦</span><FormControl><Input {...field} value={formattedAmount(field.value)} onChange={event => { const raw = event.target.value.replaceAll(',', ''); if (/^\d*(\.\d{0,2})?$/.test(raw)) field.onChange(raw.startsWith('.') ? `0${raw}` : raw); }} onBlur={() => { if (field.value && Number.isFinite(Number(field.value))) field.onChange(Number(field.value).toFixed(2)); field.onBlur(); }} inputMode="decimal" autoComplete="off" placeholder="0.00" className="h-10 bg-background pl-8 tabular-nums" /></FormControl></div><FormMessage aria-live="polite" /></FormItem>} />
        <FormField control={form.control} name="incurred_on" render={({ field }) => <FormItem className="min-w-0"><FormLabel>Date spent</FormLabel><Popover open={dateOpen} onOpenChange={setDateOpen}><PopoverTrigger asChild><FormControl><Button type="button" variant="outline" disabled={busy} className="h-10 w-full justify-start font-normal"><CalendarIcon aria-hidden="true" />{field.value ? format(new Date(`${field.value}T12:00:00`), 'd MMM yyyy') : 'Choose date'}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(`${field.value}T12:00:00`) : undefined} onSelect={date => { if (date) field.onChange(format(date, 'yyyy-MM-dd')); setDateOpen(false); }} /></PopoverContent></Popover><FormMessage aria-live="polite" /></FormItem>} />
        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description <span className="font-normal text-slate-600">(optional)</span></FormLabel><FormControl><Input {...field} maxLength={300} placeholder="e.g. November campaign" className="h-10 bg-background" /></FormControl><FormMessage aria-live="polite" /></FormItem>} />
      </div>
      {entry && <FormField control={form.control} name="reason" render={({ field }) => <FormItem><FormLabel>Reason for correction</FormLabel><FormControl><Textarea {...field} maxLength={500} placeholder="Explain the correction (at least 15 characters)" className="bg-background" /></FormControl><FormMessage aria-live="polite" /></FormItem>} />}
      <div className="flex gap-2"><Button type="submit" disabled={busy || form.formState.isSubmitting}>{busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}{busy ? 'Saving…' : entry ? 'Save changes' : 'Add cost'}</Button>{(!setup || entry) && <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>}</div>
    </fieldset>
  </form></Form>;
}

function CostRemoval({ entry, busy, onRemove, onCancel }: { entry: CohortCostEntry; busy: boolean; onRemove: (input: DeleteCohortCost) => Promise<void>; onCancel: () => void }) {
  const form = useForm<DeleteCohortCost>({ resolver: zodResolver(DeleteCohortCostSchema), defaultValues: { reason: '' } });
  return <Form {...form}><form onSubmit={form.handleSubmit(onRemove)} className="space-y-3 rounded-xl border border-red-200 p-4">
    <p className="text-sm">Remove <strong>{entry.label} · {moneyText(entry.amount)}</strong>? This will update the cohort’s total cost and return figures.</p>
    <FormField control={form.control} name="reason" render={({ field }) => <FormItem><FormLabel>Reason for removal</FormLabel><FormControl><Textarea {...field} disabled={busy} maxLength={500} placeholder="At least 15 characters" /></FormControl><FormMessage /></FormItem>} />
    <div className="flex gap-2"><Button variant="destructive" type="submit" disabled={busy || form.formState.isSubmitting}>{busy ? 'Removing…' : 'Remove cost'}</Button><Button variant="outline" type="button" disabled={busy} onClick={onCancel}>Cancel</Button></div>
  </form></Form>;
}

export function CohortCostsManager({ cohortId, initiallyAdding = false, onBusyChange, onDone }: { cohortId: string; initiallyAdding?: boolean; onBusyChange?: (busy: boolean) => void; onDone?: () => void }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has('view_cohort_costs');
  const canManage = permissions.has('manage_cohort_costs');
  const query = useCohortCosts(cohortId, canView);
  const writes = useCohortCostWrites(cohortId);
  const [editor, setEditor] = useState<'new' | CohortCostEntry | null>(initiallyAdding ? 'new' : null);
  const [removing, setRemoving] = useState<CohortCostEntry | null>(null);
  const data = query.data;
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const summaryId = useId();
  const editTrigger = useRef<HTMLButtonElement | null>(null);

  async function save(values: CohortCostForm) {
    if (!canManage || writes.isPending) return false;
    onBusyChange?.(true);
    try {
      const input = { category: values.category, amount: Number(values.amount), description: values.description, ...(values.incurred_on && { incurred_on: values.incurred_on }) };
      if (editor && editor !== 'new') await writes.update.mutateAsync({ id: editor.id, input: { ...input, reason: values.reason } });
      else await writes.create.mutateAsync(input);
      toast.success(editor === 'new' ? 'Cost added' : 'Cost updated');
      setEditor(onDone ? 'new' : null);
      return true;
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save cost'); return false; }
    finally { onBusyChange?.(false); }
  }
  async function remove(input: DeleteCohortCost) {
    if (!canManage || !removing || writes.isPending) return;
    onBusyChange?.(true);
    try { await writes.remove.mutateAsync({ id: removing.id, input }); setRemoving(null); toast.success('Cost removed'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove cost'); }
    finally { onBusyChange?.(false); }
  }

  if (!canView && !canManage) return <p className="text-sm text-slate-500">You don’t have access to cohort costs.</p>;
  const editingEntry = editor && editor !== 'new' ? editor : null;
  const closeEditor = () => { if (!writes.isPending) setEditor(onDone ? 'new' : null); };
  const editDialog = canManage && (
    <Dialog open={Boolean(editingEntry)} onOpenChange={open => { if (!open) closeEditor(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl" onCloseAutoFocus={event => { event.preventDefault(); editTrigger.current?.focus(); }}>
        <DialogHeader>
          <DialogTitle>Edit cost</DialogTitle>
          <DialogDescription>Update this expense and give a reason for the correction.</DialogDescription>
        </DialogHeader>
        {editingEntry && <CostEditor key={editingEntry.id} entry={editingEntry} inDialog busy={writes.isPending} onSave={save} onCancel={closeEditor} />}
      </DialogContent>
    </Dialog>
  );
  if (onDone) {
    const total = canView && data ? moneyText(data.total) : null;
    const count = data?.entries.length ?? 0;
    return <>
      {editDialog}
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
        <aside className="min-w-0 border-b pb-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start lg:border-b-0 lg:border-l lg:pb-0 lg:pl-8">
          <p className="text-sm font-medium text-slate-600">Total recorded cost</p>
          <div aria-live="polite" aria-atomic="true"><p className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums xl:text-4xl">{total ?? (canView ? (query.error ? 'Unavailable' : 'Loading…') : 'Restricted')}</p>{canView && data && <p className="mt-2 text-sm text-slate-600">{count} {count === 1 ? 'cost' : 'costs'} recorded</p>}</div>
          {canView && data && <div className="mt-5"><Button type="button" variant="ghost" className="w-full justify-between px-0 lg:hidden" aria-expanded={summaryExpanded} aria-controls={summaryId} onClick={() => setSummaryExpanded(value => !value)}>By category<ChevronDown className={`size-4 transition-transform duration-150 motion-reduce:transition-none ${summaryExpanded ? 'rotate-180' : ''}`} /></Button><p className="hidden text-sm font-medium lg:block">By category</p><div id={summaryId} className={`${summaryExpanded ? 'block' : 'hidden'} mt-4 space-y-4 lg:block`}>{count ? data.by_category.filter(category => data.entries.some(entry => entry.category === category.category)).map(category => { const percent = data.total.amount_minor > 0 ? category.total.amount_minor / data.total.amount_minor * 100 : 0; return <div key={category.category}><div className="flex flex-wrap justify-between gap-2 text-sm"><span>{category.label}</span><span className="tabular-nums">{moneyText(category.total)} <span className="text-slate-600">· {percent.toFixed(0)}%</span></span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-teal-700 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${percent}%` }} /></div></div>; }) : <p className="text-sm text-slate-600">Your category breakdown will appear here.</p>}</div></div>}

        </aside>
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-1">
          {canManage && !removing && !editingEntry && <CostEditor key={editor && editor !== 'new' ? editor.id : 'new'} setup entry={editor && editor !== 'new' ? editor : undefined} busy={writes.isPending} onSave={save} onCancel={() => setEditor('new')} />}
          {canManage && removing && <CostRemoval key={removing.id} entry={removing} busy={writes.isPending} onRemove={remove} onCancel={() => setRemoving(null)} />}
          <section className="border-t pt-6" aria-label="Recorded costs"><h2 className="font-semibold">Recorded costs</h2>
            {!canView ? <p className="mt-4 text-sm text-slate-600">You can add costs. Viewing existing entries requires cost viewing access.</p> : query.isLoading ? <p role="status" className="flex items-center gap-2 py-8 text-sm text-slate-600"><Loader2 className="size-4 motion-safe:animate-spin" />Loading costs…</p> : query.error ? <div role="alert" className="py-4 text-sm text-destructive">{query.error.message}<Button type="button" variant="link" onClick={() => void query.refetch()}>Try again</Button></div> : !count ? <div className="flex flex-col items-center py-10 text-center"><ReceiptText aria-hidden="true" className="mb-3 size-7 text-teal-700" /><p className="font-medium">No costs yet</p><p className="mt-1 text-sm text-slate-600">Add your first expense using the form above.</p></div> : <ul className="mt-3 divide-y">{[...data!.entries].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(entry => <li key={entry.id} className="group flex flex-wrap items-center justify-between gap-3 py-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"><div className="min-w-0 flex-1"><Badge variant="secondary">{entry.label}</Badge>{entry.description && <p className="mt-2 break-words text-sm">{entry.description}</p>}<p className="mt-1 text-xs text-slate-600">{entry.incurred_on ? format(new Date(`${cohortCostDate(entry.incurred_on)}T12:00:00`), 'd MMM yyyy') : 'Date not recorded'}</p></div><div className="flex flex-wrap items-center justify-end gap-2"><span className="text-sm font-semibold tabular-nums">{moneyText(entry.amount)}</span>{canManage && <div className="flex lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity duration-150 motion-reduce:transition-none"><Button type="button" size="icon" variant="ghost" aria-label={`Edit ${entry.label} cost`} disabled={writes.isPending || Boolean(removing)} onClick={event => { editTrigger.current = event.currentTarget; setEditor(entry); }}><Pencil size={15} /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${entry.label} cost`} disabled={writes.isPending || Boolean(removing)} onClick={() => setRemoving(entry)}><Trash2 size={15} /></Button></div>}</div></li>)}</ul>}
          </section>
        </div>
      </div>
      <div className="mt-6 flex justify-end pb-6">
        <Button type="button" disabled={writes.isPending} onClick={onDone}>Continue to cohort</Button>
      </div>
    </>;
  }
  return <div className="space-y-4">
    {editDialog}
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-slate-500">Total recorded cost</p><p className="text-2xl font-semibold">{canView && data?.recorded ? moneyText(data.total) : '—'}</p></div>{canManage && !editor && !removing && <Button type="button" onClick={() => setEditor('new')}><Plus size={15} />Add cost</Button>}</div>
    {canManage && editor === 'new' && <CostEditor key="new" busy={writes.isPending} onSave={save} onCancel={() => setEditor(null)} />}
    {canManage && removing && <CostRemoval key={removing.id} entry={removing} busy={writes.isPending} onRemove={remove} onCancel={() => setRemoving(null)} />}
    {!canView ? <p className="text-sm text-slate-500">You can add costs. Viewing existing entries requires cost viewing access.</p> : query.isLoading ? <p className="py-6 text-sm text-slate-500">Loading costs…</p> : query.error ? <div role="alert" className="text-sm text-red-600">{query.error.message}<Button type="button" variant="link" onClick={() => void query.refetch()}>Try again</Button></div> : !data?.entries.length ? <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">No costs recorded for this cohort yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="py-3 pr-3">Category / description</th><th className="p-3">Date spent</th><th className="p-3 text-right">Amount</th>{canManage && <th className="py-3 pl-3 text-right">Actions</th>}</tr></thead><tbody>{data.entries.map(entry => <tr key={entry.id} className="border-t border-slate-100"><td className="py-3 pr-3"><span className="font-medium">{entry.label}</span>{entry.description && <p className="mt-1 max-w-72 whitespace-normal break-words text-xs text-slate-500">{entry.description}</p>}</td><td className="p-3 whitespace-nowrap">{cohortCostDate(entry.incurred_on) || '—'}</td><td className="p-3 text-right whitespace-nowrap tabular-nums">{moneyText(entry.amount)}</td>{canManage && <td className="py-3 pl-3 text-right"><div className="flex justify-end gap-1"><Button type="button" size="icon" variant="ghost" aria-label={`Edit ${entry.label} cost`} disabled={writes.isPending || Boolean(editor || removing)} onClick={event => { editTrigger.current = event.currentTarget; setEditor(entry); }}><Pencil size={15} /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${entry.label} cost`} disabled={writes.isPending || Boolean(editor || removing)} onClick={() => setRemoving(entry)}><Trash2 size={15} /></Button></div></td>}</tr>)}</tbody></table></div>}
  </div>;
}

export function CohortCostsButton({ cohortId }: { cohortId: string }) {
  const permissions = useAdminPermissions();
  const canManage = permissions.has('manage_cohort_costs');
  const canView = permissions.has('view_cohort_costs');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!canManage && !canView) return null;
  return <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogTrigger asChild><Button type="button" size="sm" variant="outline">{canManage ? 'Manage costs' : 'View costs'}</Button></DialogTrigger><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Cohort costs</DialogTitle><DialogDescription>Record amounts spent on this cohort. Costs update recruitment analysis and return figures.</DialogDescription></DialogHeader>{open && <CohortCostsManager key={cohortId} cohortId={cohortId} onBusyChange={setBusy} />}</DialogContent></Dialog>;
}

export function CohortCostSetup({ cohort, onDone }: { cohort: Pick<CohortSummary, 'id' | 'name'>; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return <section className="w-full min-w-0 p-4 md:p-6">
    <ol aria-label="Cohort setup progress" className="mb-6 flex flex-wrap items-center gap-3 text-xs text-slate-600 sm:gap-4 sm:text-sm">
      <li className="flex items-center gap-2 text-teal-700"><span>1 Cohort created</span><Check className="size-4" aria-label="Complete" /></li><li aria-hidden="true">—</li><li aria-current="step" className="font-semibold text-foreground">2 Add costs</li><li aria-hidden="true">—</li><li>3 Review</li>
    </ol>
    <div className="rounded-xl border bg-card px-5 pt-6 md:px-8 md:pt-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b pb-6"><div><h1 className="text-xl font-semibold">Add costs for {cohort.name}</h1><p className="mt-2 text-sm text-slate-600">Record your expenses now, or add them later from the cohort page.</p></div><Button type="button" variant="ghost" disabled={busy} onClick={onDone}>Skip for now</Button></header>
      <CohortCostsManager cohortId={cohort.id} initiallyAdding onBusyChange={setBusy} onDone={onDone} />
    </div>
  </section>;
}

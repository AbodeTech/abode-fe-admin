'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useApplyConfirmationSheet, useConfirmationSheet, type ConfirmationSheetResult } from '../hooks/use-confirmation-sheet';
import { parseConfirmationCsv } from '../lib/confirmation-csv';
import { downloadCsv } from '../lib/csv';
import type { PickupLocation } from '../schemas/company-event.schema';

export function ConfirmationSheetPanel({ open, onOpenChange, eventId, pickupLocations }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  pickupLocations: PickupLocation[];
}) {
  const [pickupId, setPickupId] = useState('');
  const [rows, setRows] = useState<{ attendance_id: string; given: boolean }[] | null>(null);
  const [preview, setPreview] = useState<ConfirmationSheetResult | null>(null);
  const sheet = useConfirmationSheet(open ? eventId : undefined, pickupId || undefined);
  const applySheet = useApplyConfirmationSheet();

  const readFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseConfirmationCsv(await file.text());
      setRows(parsed);
      setPreview(null);
      toast.success(`${parsed.length} rows read; preview before applying`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not read sheet');
    }
  };

  const run = (apply: boolean) => {
    if (!rows) return;
    applySheet.mutate({ eventId, rows, apply }, {
      onSuccess: (result) => {
        setPreview(result);
        if (result.applied) {
          toast.success(`${result.newly_confirmed} newly confirmed`);
          setRows(null);
        }
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Offline confirmation sheet</DialogTitle>
        <DialogDescription>Download a sheet for the site, tick “given” for land handed over, then upload it. Preview shows what will change before you save.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {pickupLocations.length > 0 && <div className="space-y-1"><Label>Pickup</Label><Select value={pickupId || 'all'} onValueChange={(value) => setPickupId(value === 'all' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All pickups</SelectItem>{pickupLocations.map((pickup) => <SelectItem key={pickup.id} value={pickup.id}>{pickup.name}</SelectItem>)}</SelectContent></Select></div>}
        <Button variant="outline" disabled={!sheet.data || sheet.isLoading} onClick={() => {
          if (!sheet.data) return;
          downloadCsv(sheet.data.rows.map((row) => ({ attendance_id: row.attendance_id, name: row.name ?? '', phone: row.phone ?? '', email: row.email ?? '', pickup_location: row.pickup_location ?? '', size_reserved: row.size_reserved, eligibility_tier: row.eligibility_tier ?? '', plots: row.plots, boarded: row.boarded, given: row.given, confirmed_at: row.confirmed_at ?? '' })), `confirmation-sheet_${eventId}.csv`);
        }}><Download className="mr-2 size-4" /> Download {sheet.data?.count ?? ''} rows</Button>
        {sheet.isError && <p className="text-sm text-destructive">Could not load the confirmation sheet. Try again.</p>}
        <div className="space-y-1"><Label htmlFor="confirmation-upload">Returned CSV</Label><Input id="confirmation-upload" type="file" accept=".csv,text/csv" onChange={(event) => void readFile(event.target.files?.[0])} /></div>
        {rows && <p className="text-sm text-muted-foreground">{rows.length} rows loaded; {rows.filter((row) => row.given).length} ticked.</p>}
        {preview && <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p>{preview.newly_confirmed} new confirmations · {preview.already_confirmed} already confirmed · {preview.unmatched.length} unmatched</p>
          {preview.unmatched.length > 0 && <p className="mt-1 break-all text-destructive">Unmatched IDs: {preview.unmatched.join(', ')}</p>}
        </div>}
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={!rows || applySheet.isPending} onClick={() => run(false)}>{applySheet.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Preview changes'}</Button>
        <Button disabled={!rows || !preview || preview.unmatched.length > 0 || applySheet.isPending} onClick={() => run(true)}>Apply confirmations</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

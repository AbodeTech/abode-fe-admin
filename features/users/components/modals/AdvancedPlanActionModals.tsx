'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  useCloseAndRelocateUserPlan,
  useEditUserPlanCommissionConfig,
  useEditUserPlanCommissionRecipients,
  useUserPlanCreationAssets,
} from '../../hooks/use-user-plan-mutations';
import {
  AdminCloseAndRelocatePayloadSchema,
  AdminEditPlanCommissionConfigPayloadSchema,
  AdminEditPlanCommissionRecipientsPayloadSchema,
} from '../../schemas/user-plan-actions.schema';
import { getErrorMessage } from '../../utils/error-message';

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  planId: string;
  expectedUpdatedAt?: string;
};

const asOptionalNumber = (value: string) => (value.trim() ? Number(value) : undefined);

export function CloseAndRelocatePlanModal(props: BaseProps) {
  const mutation = useCloseAndRelocateUserPlan();
  const assets = useUserPlanCreationAssets(props.open);
  const [type, setType] = useState<'flex' | 'full-ownership' | 'commercial' | 'developer_plot'>('flex');
  const [assetId, setAssetId] = useState('');
  const [size, setSize] = useState('');
  const [units, setUnits] = useState('1');
  const [assetPrice, setAssetPrice] = useState('');
  const [initial, setInitial] = useState('');
  const [monthly, setMonthly] = useState('');
  const [tenor, setTenor] = useState('');
  const [landPrice, setLandPrice] = useState('');
  const [landInitial, setLandInitial] = useState('');
  const [landMonthly, setLandMonthly] = useState('');
  const [landTenor, setLandTenor] = useState('');
  const [documentPrice, setDocumentPrice] = useState('0');
  const [documentMonthly, setDocumentMonthly] = useState('0');
  const [documentTenor, setDocumentTenor] = useState('0');
  const [allocationPct, setAllocationPct] = useState('');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);

  const assetOptions = useMemo(
    () =>
      (assets.data?.items ?? []).filter(
        (asset) =>
          type === 'developer_plot' ||
          asset.offers.some((offer) => offer.offer_type === type && offer.is_active),
      ),
    [assets.data?.items, type],
  );

  const submit = async () => {
    try {
      const payload = AdminCloseAndRelocatePayloadSchema.parse({
        reason,
        notify_user: notify,
        expected_updated_at: props.expectedUpdatedAt,
        new_plan: {
          asset_type: type,
          asset_id: assetId,
          size_sqm: Number(size),
          number_of_units: Number(units),
          queue_signature_reminder: true,
          asset_price: asOptionalNumber(assetPrice),
          initial_payment: asOptionalNumber(initial),
          monthly_payment: asOptionalNumber(monthly),
          tenor_months: asOptionalNumber(tenor),
          land_price: asOptionalNumber(landPrice),
          land_initial_payment: asOptionalNumber(landInitial),
          land_monthly_payment: asOptionalNumber(landMonthly),
          land_tenor_months: asOptionalNumber(landTenor),
          document_price: asOptionalNumber(documentPrice),
          document_monthly_payment: asOptionalNumber(documentMonthly),
          document_tenor_months: asOptionalNumber(documentTenor),
          payment_type: type === 'flex' ? undefined : 'all-inclusive',
          allocation_qualification_pct: asOptionalNumber(allocationPct),
        },
      });
      await mutation.mutateAsync({ userId: props.userId, planId: props.planId, payload });
      toast.success('Plan closed and payment relocated');
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to relocate payment plan'));
    }
  };

  const field = (label: string, value: string, setter: (value: string) => void) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" min="0" value={value} onChange={(event) => setter(event.target.value)} />
    </div>
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Close and relocate plan</DialogTitle>
          <DialogDescription>The old plan closes and its recorded land payment carries into this replacement.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="grid gap-4 p-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Replacement type</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as typeof type);
                  setAssetId('');
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="full-ownership">Full Ownership</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="developer_plot">Developer Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Replacement asset</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>{assetOptions.map((asset) => <SelectItem key={asset._id} value={asset._id}>{asset.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {field('Size (sqm)', size, setSize)}
            {field('Number of units', units, setUnits)}
            {type === 'flex' ? (
              <>
                {field('Asset price', assetPrice, setAssetPrice)}
                {field('Initial payment', initial, setInitial)}
                {field('Monthly payment', monthly, setMonthly)}
                {field('Tenor (months)', tenor, setTenor)}
              </>
            ) : (
              <>
                {field('Land price', landPrice, setLandPrice)}
                {field('Land initial payment', landInitial, setLandInitial)}
                {field('Land monthly payment', landMonthly, setLandMonthly)}
                {field('Land tenor (months)', landTenor, setLandTenor)}
                {field('Document price', documentPrice, setDocumentPrice)}
                {field('Document monthly payment', documentMonthly, setDocumentMonthly)}
                {field('Document tenor (months)', documentTenor, setDocumentTenor)}
              </>
            )}
            {field('Allocation threshold (%)', allocationPct, setAllocationPct)}
          </div>
          <div className="space-y-3 px-1 pt-4">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum 30 characters.</p>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />Notify user by email</label>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={mutation.isPending || !assetId || reason.trim().length < 30} onClick={submit}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Close and relocate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CommissionModalProps = BaseProps & { mode: 'config' | 'recipients' };

export function EditPlanCommissionModal(props: CommissionModalProps) {
  const configMutation = useEditUserPlanCommissionConfig();
  const recipientsMutation = useEditUserPlanCommissionRecipients();
  const [reason, setReason] = useState('');
  const [operation, setOperation] = useState<'replace' | 'append' | 'remove_by_index'>('replace');
  const [configVersion, setConfigVersion] = useState('');
  const [json, setJson] = useState('[]');
  const [removeIndex, setRemoveIndex] = useState('0');

  const submit = async () => {
    try {
      if (props.mode === 'config') {
        const payload = AdminEditPlanCommissionConfigPayloadSchema.parse({
          reason,
          expected_updated_at: props.expectedUpdatedAt,
          new_config_version: asOptionalNumber(configVersion),
          recipient_rate_updates: JSON.parse(json),
        });
        await configMutation.mutateAsync({ userId: props.userId, planId: props.planId, payload });
      } else {
        const parsed = JSON.parse(json);
        const payload = AdminEditPlanCommissionRecipientsPayloadSchema.parse({
          reason,
          expected_updated_at: props.expectedUpdatedAt,
          operation,
          new_recipients: operation === 'replace' ? parsed : undefined,
          new_recipient: operation === 'append' ? parsed : undefined,
          remove_index: operation === 'remove_by_index' ? Number(removeIndex) : undefined,
        });
        await recipientsMutation.mutateAsync({ userId: props.userId, planId: props.planId, payload });
      }
      toast.success('Frozen commission snapshot updated');
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update frozen commission snapshot'));
    }
  };

  const pending = configMutation.isPending || recipientsMutation.isPending;
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit frozen commission {props.mode}</DialogTitle>
          <DialogDescription>This affects future commission processing for this plan; already-paid commission is unchanged.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {props.mode === 'config' ? (
            <div className="space-y-2"><Label>Config version (optional)</Label><Input type="number" value={configVersion} onChange={(e) => setConfigVersion(e.target.value)} /></div>
          ) : (
            <div className="space-y-2"><Label>Operation</Label><Select value={operation} onValueChange={(v) => setOperation(v as typeof operation)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="replace">Replace all</SelectItem><SelectItem value="append">Append one</SelectItem><SelectItem value="remove_by_index">Remove by index</SelectItem></SelectContent></Select></div>
          )}
          {props.mode === 'recipients' && operation === 'remove_by_index' ? (
            <div className="space-y-2"><Label>Recipient index</Label><Input type="number" min="0" value={removeIndex} onChange={(e) => setRemoveIndex(e.target.value)} /></div>
          ) : (
            <div className="space-y-2"><Label>{props.mode === 'config' ? 'Rate updates JSON' : 'Recipient JSON'}</Label><Textarea className="min-h-32 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} /><p className="text-xs text-muted-foreground">{props.mode === 'config' ? 'Array of { index, new_rate }.' : operation === 'replace' ? 'Array of recipient objects.' : 'One recipient object.'}</p></div>
          )}
          <div className="space-y-2"><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /><p className="text-xs text-muted-foreground">Minimum 30 characters.</p></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button><Button disabled={pending || reason.trim().length < 30} onClick={submit}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update snapshot</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

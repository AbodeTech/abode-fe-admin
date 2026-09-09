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
  useCreateUserCommercialPlan,
  useCreateUserDeveloperPlot,
  useCreateUserFlexPlan,
  useCreateUserFullOwnershipPlan,
  useUserPlanCreationAssets,
} from '../../hooks/use-user-plan-mutations';
import {
  ADMIN_CREATE_SUBTYPES,
  AdminCreateDeveloperPlanPayloadSchema,
  AdminCreateFlexPlanPayloadSchema,
  AdminCreateOwnershipPlanPayloadSchema,
} from '../../schemas/user-plan-actions.schema';
import { getErrorMessage } from '../../utils/error-message';

export type AdminPlanType = 'flex' | 'full-ownership' | 'commercial' | 'developer-plot';

type Props = {
  userId: string;
  type: AdminPlanType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  asset_id: string;
  size_sqm: string;
  number_of_units: string;
  tenor_months: string;
  asset_price: string;
  monthly_payment: string;
  initial_payment: string;
  amount_paid: string;
  land_price: string;
  land_initial_payment: string;
  land_monthly_payment: string;
  land_tenor_months: string;
  land_amount_paid: string;
  document_price: string;
  document_amount_paid: string;
  document_monthly_payment: string;
  document_tenor_months: string;
  payment_type: 'all-inclusive' | 'partially-inclusive';
  admin_creation_subtype: (typeof ADMIN_CREATE_SUBTYPES)[number];
  reason: string;
  name_on_document: string;
  address: string;
  start_date: string;
  plan_completed_at: string;
  document_start_date: string;
  document_completed_at: string;
  campaign_ids: string;
  campaign_purchase_date: string;
  allocation_qualification_pct: string;
  fire_commission: boolean;
  queue_signature_reminder: boolean;
  create_purchase_transaction: boolean;
  notify_user: boolean;
};

const emptyForm = (type: AdminPlanType): FormState => ({
  asset_id: '',
  size_sqm: '',
  number_of_units: '1',
  tenor_months: '',
  asset_price: '',
  monthly_payment: '',
  initial_payment: '',
  amount_paid: '',
  land_price: '',
  land_initial_payment: '',
  land_monthly_payment: '',
  land_tenor_months: '',
  land_amount_paid: '',
  document_price: '0',
  document_amount_paid: '0',
  document_monthly_payment: '0',
  document_tenor_months: '0',
  payment_type: 'all-inclusive',
  admin_creation_subtype:
    type === 'developer-plot' ? 'developer_plot' : type === 'commercial' ? 'commercial_new' : 'other',
  reason: '',
  name_on_document: '',
  address: '',
  start_date: '',
  plan_completed_at: '',
  document_start_date: '',
  document_completed_at: '',
  campaign_ids: '',
  campaign_purchase_date: '',
  allocation_qualification_pct: '',
  fire_commission: false,
  queue_signature_reminder: true,
  create_purchase_transaction: true,
  notify_user: true,
});

const labels: Record<AdminPlanType, string> = {
  flex: 'Flex',
  'full-ownership': 'Full Ownership',
  commercial: 'Commercial',
  'developer-plot': 'Developer Plot',
};

const number = (value: string) => Number(value.replace(/,/g, ''));
const date = (value: string) => (value ? new Date(`${value}T12:00:00`).toISOString() : undefined);

export function CreateUserPlanModal({ userId, type, open, onOpenChange }: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(type));
  const assets = useUserPlanCreationAssets(open);
  const flex = useCreateUserFlexPlan();
  const ownership = useCreateUserFullOwnershipPlan();
  const commercial = useCreateUserCommercialPlan();
  const developer = useCreateUserDeveloperPlot();
  const isLand = type !== 'flex';

  const options = useMemo(
    () =>
      (assets.data?.items ?? []).filter(
        (asset) =>
          type === 'developer-plot' ||
          asset.offers.some((offer) => offer.offer_type === type && offer.is_active),
      ),
    [assets.data?.items, type],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const common = {
    asset_id: form.asset_id,
    size_sqm: number(form.size_sqm),
    number_of_units: number(form.number_of_units),
    admin_creation_subtype: form.admin_creation_subtype,
    reason: form.reason,
    name_on_document: form.name_on_document,
    address: form.address,
    fire_commission: form.fire_commission,
    queue_signature_reminder: form.queue_signature_reminder,
    create_purchase_transaction: form.create_purchase_transaction,
    notify_user: form.notify_user,
    start_date: date(form.start_date),
    plan_completed_at: date(form.plan_completed_at),
    campaign_ids: form.campaign_ids
      ? form.campaign_ids.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined,
    campaign_purchase_date: date(form.campaign_purchase_date),
    allocation_qualification_pct: form.allocation_qualification_pct
      ? number(form.allocation_qualification_pct)
      : undefined,
  };

  const submit = async () => {
    try {
      if (type === 'flex') {
        const payload = AdminCreateFlexPlanPayloadSchema.parse({
          ...common,
          tenor_months: number(form.tenor_months),
          asset_price: number(form.asset_price),
          monthly_payment: number(form.monthly_payment),
          initial_payment: number(form.initial_payment),
          amount_paid: number(form.amount_paid),
        });
        await flex.mutateAsync({ userId, payload });
      } else {
        const raw = {
          ...common,
          land_price: number(form.land_price),
          land_initial_payment: number(form.land_initial_payment),
          land_monthly_payment: number(form.land_monthly_payment),
          land_tenor_months: number(form.land_tenor_months),
          land_amount_paid: number(form.land_amount_paid),
          document_price: number(form.document_price),
          document_amount_paid: number(form.document_amount_paid),
          document_monthly_payment: number(form.document_monthly_payment),
          document_tenor_months: number(form.document_tenor_months),
          document_start_date: date(form.document_start_date),
          document_completed_at: date(form.document_completed_at),
          payment_type: form.payment_type,
        };
        if (type === 'developer-plot') {
          const payload = AdminCreateDeveloperPlanPayloadSchema.parse(raw);
          await developer.mutateAsync({ userId, payload });
        } else {
          const payload = AdminCreateOwnershipPlanPayloadSchema.parse(raw);
          await (type === 'commercial' ? commercial : ownership).mutateAsync({ userId, payload });
        }
      }
      toast.success(`${labels[type]} plan created`);
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create payment plan'));
    }
  };

  const pending = flex.isPending || ownership.isPending || commercial.isPending || developer.isPending;
  const input = (key: keyof FormState, label: string, inputType = 'number') => (
    <div className="space-y-2" key={key}>
      <Label htmlFor={`create-plan-${key}`}>{label}</Label>
      <Input
        id={`create-plan-${key}`}
        type={inputType}
        value={String(form[key])}
        onChange={(event) => set(key, event.target.value as never)}
      />
    </div>
  );

  const toggle = (key: keyof FormState, label: string) => (
    <label className="flex items-center gap-2 text-sm" key={key}>
      <Checkbox
        checked={Boolean(form[key])}
        onCheckedChange={(checked) => set(key, (checked === true) as never)}
      />
      {label}
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create {labels[type]} plan</DialogTitle>
          <DialogDescription>
            Record the legal document details, contract prices, payment schedule, and money already paid.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid grid-cols-1 gap-4 p-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Asset</Label>
              <Select value={form.asset_id} onValueChange={(value) => set('asset_id', value)}>
                <SelectTrigger><SelectValue placeholder={assets.isLoading ? 'Loading assets…' : 'Select asset'} /></SelectTrigger>
                <SelectContent>
                  {options.map((asset) => <SelectItem key={asset._id} value={asset._id}>{asset.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Creation subtype</Label>
              <Select value={form.admin_creation_subtype} onValueChange={(value) => set('admin_creation_subtype', value as FormState['admin_creation_subtype'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADMIN_CREATE_SUBTYPES.map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {input('size_sqm', 'Size (sqm)')}
            {input('number_of_units', 'Number of units')}
            {type === 'flex' ? (
              <>
                {input('asset_price', 'Total asset price')}
                {input('initial_payment', 'Contractual initial payment')}
                {input('amount_paid', 'Actual cumulative amount paid')}
                {input('monthly_payment', 'Monthly payment')}
                {input('tenor_months', 'Tenor (months)')}
              </>
            ) : (
              <>
                {input('land_price', 'Land price')}
                {input('land_initial_payment', 'Land initial payment')}
                {input('land_amount_paid', 'Land amount paid')}
                {input('land_monthly_payment', 'Land monthly payment')}
                {input('land_tenor_months', 'Land tenor (months)')}
                {input('document_price', 'Document price')}
                {input('document_amount_paid', 'Document amount paid')}
                {input('document_monthly_payment', 'Document monthly payment')}
                {input('document_tenor_months', 'Document tenor (months)')}
                <div className="space-y-2">
                  <Label>Payment type</Label>
                  <Select value={form.payment_type} onValueChange={(value) => set('payment_type', value as FormState['payment_type'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-inclusive">All-inclusive</SelectItem>
                      <SelectItem value="partially-inclusive">Partially-inclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {input('start_date', 'Plan start date', 'date')}
            {input('plan_completed_at', 'Plan completed date', 'date')}
            {isLand && input('document_start_date', 'Document start date', 'date')}
            {isLand && input('document_completed_at', 'Document completed date', 'date')}
            {input('allocation_qualification_pct', 'Allocation threshold (%)')}
            {input('campaign_purchase_date', 'Campaign purchase date', 'date')}
            {input('campaign_ids', 'Campaign IDs (comma separated)', 'text')}
            {input('name_on_document', 'Name on document', 'text')}
            {input('address', 'Buyer address', 'text')}
          </div>
          <div className="space-y-4 px-1 pt-4">
            <div className="space-y-2">
              <Label htmlFor="create-plan-reason">Reason</Label>
              <Textarea id="create-plan-reason" value={form.reason} onChange={(event) => set('reason', event.target.value)} />
              <p className="text-xs text-muted-foreground">Minimum 30 characters; saved to the admin audit log.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {toggle('fire_commission', 'Fire commission')}
              {toggle('queue_signature_reminder', 'Queue signature reminder')}
              {toggle('create_purchase_transaction', 'Create purchase transaction')}
              {toggle('notify_user', 'Notify user by email')}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={pending || !form.asset_id || form.reason.trim().length < 30} onClick={submit}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

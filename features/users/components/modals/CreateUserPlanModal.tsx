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
  useUserPlanCreationCampaigns,
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
  campaign_ids: string[];
  campaign_purchase_date: string;
  allocation_qualification_pct: string;
  fire_commission: boolean;
  queue_signature_reminder: boolean;
  create_purchase_transaction: boolean;
  notify_user: boolean;
  /** Flex only. Defaults on; only an explicit off is sent. */
  enable_streaks: boolean;
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
  campaign_ids: [],
  campaign_purchase_date: '',
  allocation_qualification_pct: '',
  fire_commission: false,
  queue_signature_reminder: true,
  create_purchase_transaction: true,
  notify_user: true,
  enable_streaks: true,
});

const labels: Record<AdminPlanType, string> = {
  flex: 'Flex',
  'full-ownership': 'Full Ownership',
  commercial: 'Commercial',
  'developer-plot': 'Developer Plot',
};

const number = (value: string) => Number(value.replace(/,/g, ''));
const date = (value: string) => (value ? new Date(`${value}T12:00:00`).toISOString() : undefined);
const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

export function CreateUserPlanModal({ userId, type, open, onOpenChange }: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(type));
  const requestedOfferType = type === 'developer-plot' ? undefined : type;
  const assets = useUserPlanCreationAssets(open, requestedOfferType);
  const campaigns = useUserPlanCreationCampaigns(open && type !== 'developer-plot');
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
  const campaignOptions = useMemo(
    () =>
      (campaigns.data?.items ?? []).filter(
        (campaign) =>
          campaign.status === 'active' &&
          (campaign.eligible_asset_types.length === 0 ||
            campaign.eligible_asset_types.includes(type)),
      ),
    [campaigns.data?.items, type],
  );
  const landSchedule = useMemo(() => {
    const price = number(type === 'flex' ? form.asset_price : form.land_price);
    const initial = number(type === 'flex' ? form.initial_payment : form.land_initial_payment);
    const monthly = number(type === 'flex' ? form.monthly_payment : form.land_monthly_payment);
    const tenor = number(type === 'flex' ? form.tenor_months : form.land_tenor_months);
    const paid = number(type === 'flex' ? form.amount_paid : form.land_amount_paid);
    const balance = Math.max(0, price - paid);
    const scheduledTotal = initial + monthly * Math.max(0, tenor - 1);
    const uncovered = balance > 0 ? Math.max(0, price - scheduledTotal) : 0;
    return { price, paid, balance, scheduledTotal, uncovered };
  }, [form, type]);
  const documentSchedule = useMemo(() => {
    const price = number(form.document_price);
    const paid = number(form.document_amount_paid);
    const monthly = number(form.document_monthly_payment);
    const tenor = number(form.document_tenor_months);
    const balance = Math.max(0, price - paid);
    const scheduledTotal = monthly * tenor;
    const uncovered = balance > 0 ? Math.max(0, price - scheduledTotal) : 0;
    return { price, paid, balance, scheduledTotal, uncovered };
  }, [
    form.document_amount_paid,
    form.document_monthly_payment,
    form.document_price,
    form.document_tenor_months,
  ]);
  const creationBlockers = [
    !form.asset_id ? 'Select an asset.' : null,
    landSchedule.uncovered > 0
      ? `Land schedule is short by ${money.format(landSchedule.uncovered)}.`
      : null,
    isLand && documentSchedule.uncovered > 0
      ? `Document schedule is short by ${money.format(documentSchedule.uncovered)}.`
      : null,
    form.campaign_ids.length > 0 && !form.campaign_purchase_date
      ? 'Enter the campaign payment approval date.'
      : null,
    form.reason.trim().length < 30
      ? `Enter an admin reason of at least 30 characters (${form.reason.trim().length}/30).`
      : null,
  ].filter((message): message is string => Boolean(message));

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
    campaign_ids: form.campaign_ids.length ? form.campaign_ids : undefined,
    campaign_purchase_date: date(form.campaign_purchase_date),
    allocation_qualification_pct: form.allocation_qualification_pct
      ? number(form.allocation_qualification_pct)
      : undefined,
  };

  const submit = async () => {
    if (creationBlockers.length > 0) {
      toast.error(creationBlockers[0]);
      return;
    }
    try {
      if (type === 'flex') {
        const payload = AdminCreateFlexPlanPayloadSchema.parse({
          ...common,
          tenor_months: number(form.tenor_months),
          asset_price: number(form.asset_price),
          monthly_payment: number(form.monthly_payment),
          initial_payment: number(form.initial_payment),
          amount_paid: number(form.amount_paid),
          // The backend default is "on", so only an explicit off is sent (Q12).
          ...(form.enable_streaks ? {} : { enable_streaks: false }),
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
  const input = (
    key: keyof FormState,
    label: string,
    inputType = 'number',
    required = true,
  ) => (
    <div className="space-y-2" key={key}>
      <Label htmlFor={`create-plan-${key}`}>
        {label}{required ? ' *' : ' (optional)'}
      </Label>
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
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Create {labels[type]} plan</DialogTitle>
          <DialogDescription>
            Record the legal document details, contract prices, payment schedule, and money already paid.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid grid-cols-1 gap-4 p-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Asset *</Label>
              <Select
                value={form.asset_id}
                onValueChange={(value) => set('asset_id', value)}
                disabled={assets.isLoading || assets.isError || options.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      assets.isLoading
                        ? 'Loading assets…'
                        : assets.isError
                          ? 'Unable to load assets'
                          : options.length === 0
                            ? `No ${labels[type]} assets available`
                            : 'Select asset'
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[100] max-h-72">
                  {options.map((asset) => <SelectItem key={asset._id} value={asset._id}>{asset.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {assets.isError ? (
                <p className="text-xs text-destructive">
                  Assets could not be loaded. Confirm this admin can view assets, then try again.
                </p>
              ) : !assets.isLoading && options.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active {labels[type]} offer is available for plan creation.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Creation subtype *</Label>
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
                {input('land_tenor_months', 'Land tenor (includes initial-payment month)')}
                {input('document_price', 'Document price')}
                {input('document_amount_paid', 'Document amount paid')}
                {input('document_monthly_payment', 'Document monthly payment')}
                {input('document_tenor_months', 'Document tenor (months)')}
                <div className="space-y-2">
                  <Label>Payment type *</Label>
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
            {input('start_date', 'Plan start date', 'date', false)}
            {input('plan_completed_at', 'Land fully paid date', 'date', false)}
            {isLand && input('document_start_date', 'Document start date', 'date', false)}
            {isLand &&
              input('document_completed_at', 'Document fees fully paid date', 'date', false)}
            {input('allocation_qualification_pct', 'Allocation threshold (%)', 'number', false)}
            {input('name_on_document', 'Name on document', 'text')}
            {input('address', 'Buyer address', 'text')}
          </div>
          <div className="grid gap-3 px-1 pt-4 md:grid-cols-2">
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium">Land payment summary</p>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Total price</span>
                <span className="text-right text-foreground">{money.format(landSchedule.price)}</span>
                <span>Already paid</span>
                <span className="text-right text-foreground">{money.format(landSchedule.paid)}</span>
                <span>Current balance</span>
                <span className="text-right text-foreground">{money.format(landSchedule.balance)}</span>
                <span>Contract schedule total</span>
                <span className="text-right text-foreground">
                  {money.format(landSchedule.scheduledTotal)}
                </span>
                <span>Uncovered amount</span>
                <span
                  className={`text-right font-medium ${landSchedule.uncovered > 0 ? 'text-destructive' : 'text-foreground'}`}
                >
                  {money.format(landSchedule.uncovered)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedule total = initial payment + monthly payment × remaining tenor months.
              </p>
            </div>
            {isLand ? (
              <div className="space-y-2 rounded-md border p-3 text-sm">
                <p className="font-medium">Document payment summary</p>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Document price</span>
                  <span className="text-right text-foreground">
                    {money.format(documentSchedule.price)}
                  </span>
                  <span>Already paid</span>
                  <span className="text-right text-foreground">
                    {money.format(documentSchedule.paid)}
                  </span>
                  <span>Current balance</span>
                  <span className="text-right text-foreground">
                    {money.format(documentSchedule.balance)}
                  </span>
                  <span>Instalment schedule total</span>
                  <span className="text-right text-foreground">
                    {money.format(documentSchedule.scheduledTotal)}
                  </span>
                  <span>Uncovered amount</span>
                  <span
                    className={`text-right font-medium ${documentSchedule.uncovered > 0 ? 'text-destructive' : 'text-foreground'}`}
                  >
                    {money.format(documentSchedule.uncovered)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
          {type !== 'developer-plot' ? (
            <div className="space-y-3 px-1 pt-4">
              <div>
                <Label>Campaigns (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Select campaigns only when this purchase should count toward campaign rewards.
                </p>
              </div>
              {campaigns.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading active campaigns…</p>
              ) : campaigns.isError ? (
                <p className="text-sm text-destructive">
                  Campaigns could not be loaded. You can still create the plan without one.
                </p>
              ) : campaignOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active campaign accepts {labels[type]} purchases.
                </p>
              ) : (
                <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border p-3 md:grid-cols-2">
                  {campaignOptions.map((campaign) => {
                    const checked = form.campaign_ids.includes(campaign.id);
                    return (
                      <label className="flex items-start gap-2 text-sm" key={campaign.id}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            set(
                              'campaign_ids',
                              value === true
                                ? [...form.campaign_ids, campaign.id]
                                : form.campaign_ids.filter((id) => id !== campaign.id),
                            )
                          }
                        />
                        <span>
                          <span className="block font-medium">{campaign.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(campaign.start_date).toLocaleDateString()} –{' '}
                            {new Date(campaign.end_date).toLocaleDateString()}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {input(
                'campaign_purchase_date',
                'Payment approval date for campaign',
                'date',
                form.campaign_ids.length > 0,
              )}
            </div>
          ) : null}
          <div className="space-y-4 px-1 pt-4">
            <div className="space-y-2">
              <Label htmlFor="create-plan-reason">Reason *</Label>
              <Textarea id="create-plan-reason" value={form.reason} onChange={(event) => set('reason', event.target.value)} />
              <p className="text-xs text-muted-foreground">Minimum 30 characters; saved to the admin audit log.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {toggle('fire_commission', 'Fire commission')}
              {toggle('queue_signature_reminder', 'Queue signature reminder')}
              {toggle('create_purchase_transaction', 'Create purchase transaction')}
              {toggle('notify_user', 'Notify user by email')}
              {type === 'flex' ? toggle('enable_streaks', 'Enable streaks') : null}
            </div>
            {type === 'flex' ? (
              <p className="text-xs text-muted-foreground">
                Enable streaks is on by default. Turn it off and this plan neither earns nor blocks the customer&apos;s account-wide streak.
              </p>
            ) : null}
          </div>
        </ScrollArea>
        <DialogFooter>
          {creationBlockers.length > 0 && (
            <div className="mr-auto max-w-2xl text-left text-xs text-destructive">
              <p className="font-medium">Complete these before creating the plan:</p>
              <ul className="list-disc pl-4">
                {creationBlockers.map((message) => <li key={message}>{message}</li>)}
              </ul>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={pending}
            onClick={submit}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { UserPicker } from '@/components/shared/UserPicker';
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
import { useAgencies } from '@/features/agency/hooks/use-agencies';
import { useUserDisplayName } from '@/features/commission/hooks/use-developer-plot-config';
import type { UserAssetCommissionRecipient } from '@/lib/api/admin/user-assets.types';

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

type RelocationProps = BaseProps & {
  carryOverAmount: number;
};

const asOptionalNumber = (value: string) => (value.trim() ? Number(value) : undefined);

export function CloseAndRelocatePlanModal(props: RelocationProps) {
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
  const [landPaid, setLandPaid] = useState('');
  const [documentPrice, setDocumentPrice] = useState('0');
  const [documentPaid, setDocumentPaid] = useState('0');
  const [documentMonthly, setDocumentMonthly] = useState('0');
  const [documentTenor, setDocumentTenor] = useState('0');
  const [allocationPct, setAllocationPct] = useState('');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);

  const requiredFlexTermsPresent = [size, units, assetPrice, initial, monthly, tenor].every(
    (value) => value.trim() !== '',
  );
  const requiredLandTermsPresent = [
    size,
    units,
    landPrice,
    landInitial,
    landMonthly,
    landTenor,
    landPaid,
    documentPrice,
    documentPaid,
    documentMonthly,
    documentTenor,
  ].every((value) => value.trim() !== '');
  const allocatedCarryOver = Number(landPaid || 0) + Number(documentPaid || 0);
  const carryOverMatches = Math.abs(allocatedCarryOver - props.carryOverAmount) < 0.01;
  const assetPriceNumber = Number(assetPrice || 0);
  const initialNumber = Number(initial || 0);
  const landPriceNumber = Number(landPrice || 0);
  const landInitialNumber = Number(landInitial || 0);
  const landPaidNumber = Number(landPaid || 0);
  const documentPriceNumber = Number(documentPrice || 0);
  const documentPaidNumber = Number(documentPaid || 0);
  const flexTermsValid =
    !requiredFlexTermsPresent ||
    (props.carryOverAmount <= assetPriceNumber &&
      initialNumber <= assetPriceNumber &&
      (props.carryOverAmount >= assetPriceNumber ||
        (Number(monthly) > 0 && Number(tenor) >= 1)));
  const landTermsValid =
    !requiredLandTermsPresent ||
    (landPaidNumber <= landPriceNumber &&
      landInitialNumber <= landPriceNumber &&
      documentPaidNumber <= documentPriceNumber &&
      (landPaidNumber >= landPriceNumber ||
        (Number(landMonthly) > 0 && Number(landTenor) >= 1)) &&
      (documentPaidNumber >= documentPriceNumber ||
        (Number(documentMonthly) > 0 && Number(documentTenor) >= 1)));
  const termsAreValid = type === 'flex' ? flexTermsValid : landTermsValid;

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
    if (type !== 'flex' && !carryOverMatches) {
      toast.error(
        `Land paid and document paid must add up to the ${props.carryOverAmount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} carried from the old plan.`,
      );
      return;
    }
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
          land_amount_paid: type === 'flex' ? undefined : asOptionalNumber(landPaid),
          document_amount_paid: type === 'flex' ? undefined : asOptionalNumber(documentPaid),
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
          <DialogDescription>
            The old plan closes and {props.carryOverAmount.toLocaleString('en-NG', {
              style: 'currency',
              currency: 'NGN',
            })} already paid carries into the replacement plan.
          </DialogDescription>
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
                  if (value === 'flex') {
                    setLandPaid('');
                    setDocumentPaid('0');
                  } else {
                    setLandPaid(String(props.carryOverAmount));
                    setDocumentPaid('0');
                  }
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
                {field('Amount carried to land', landPaid, setLandPaid)}
                {field('Document price', documentPrice, setDocumentPrice)}
                {field('Amount carried to documents', documentPaid, setDocumentPaid)}
                {field('Document monthly payment', documentMonthly, setDocumentMonthly)}
                {field('Document tenor (months)', documentTenor, setDocumentTenor)}
              </>
            )}
            {field('Allocation threshold (%)', allocationPct, setAllocationPct)}
          </div>
          {type !== 'flex' ? (
            <div
              className={`mx-1 mt-4 flex justify-between rounded-md px-3 py-2 text-sm ${
                carryOverMatches ? 'bg-muted/40' : 'bg-destructive/10 text-destructive'
              }`}
            >
              <span>Payment allocated to replacement</span>
              <span className="font-semibold">
                {allocatedCarryOver.toLocaleString('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                })}{' '}
                of{' '}
                {props.carryOverAmount.toLocaleString('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                })}
              </span>
            </div>
          ) : null}
          {!termsAreValid ? (
            <p className="mx-1 mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Paid and initial amounts cannot exceed their prices. When a balance remains, monthly
              payment and tenor must both be greater than zero.
            </p>
          ) : null}
          <div className="space-y-3 px-1 pt-4">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum 30 characters.</p>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />Notify user by email</label>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={
              mutation.isPending ||
              !assetId ||
              reason.trim().length < 30 ||
              (type === 'flex' ? !requiredFlexTermsPresent : !requiredLandTermsPresent) ||
              (type !== 'flex' && !carryOverMatches) ||
              !termsAreValid
            }
            onClick={submit}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Close and relocate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CommissionModalProps = BaseProps & {
  mode: 'config' | 'recipients';
  commissionConfigVersion?: number | null;
  recipients: UserAssetCommissionRecipient[];
};

type EditableRecipient = UserAssetCommissionRecipient & {
  user_id: string;
  agency_id: string;
  rate_percent: string;
  user_label?: string;
};

const COMMISSION_TYPE_LABELS: Record<UserAssetCommissionRecipient['commission_type'], string> = {
  direct: 'Direct referrer',
  upline: 'Upline',
  topline: 'Topline',
  agency: 'Agency',
  founder: 'Founder',
};

const editableRecipients = (recipients: UserAssetCommissionRecipient[]): EditableRecipient[] =>
  recipients.map((recipient) => ({
    ...recipient,
    user_id: recipient.user_id ?? '',
    agency_id: recipient.agency_id ?? '',
    rate_percent: String(Math.round(recipient.rate * 10_000) / 100),
  }));

function RecipientUserPicker({
  recipient,
  onChange,
}: {
  recipient: EditableRecipient;
  onChange: (userId: string, label?: string, tier?: string | null) => void;
}) {
  const displayName = useUserDisplayName(recipient.user_id);
  return (
    <UserPicker
      value={recipient.user_id}
      fallbackLabel={recipient.user_label ?? displayName.data ?? undefined}
      placeholder="Select recipient"
      onChange={(userId, option) => onChange(userId, option?.label, option?.tier)}
    />
  );
}

function RecipientIdentity({
  recipient,
  agencyName,
}: {
  recipient: EditableRecipient;
  agencyName?: string;
}) {
  const displayName = useUserDisplayName(recipient.user_id);
  const fallback = recipient.user_id
    ? `User …${recipient.user_id.slice(-6)}`
    : recipient.agency_id
      ? `Agency …${recipient.agency_id.slice(-6)}`
      : 'Recipient not selected';
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">
        {recipient.commission_type === 'agency'
          ? agencyName ?? fallback
          : recipient.user_label ?? displayName.data ?? fallback}
      </p>
      <p className="text-xs text-muted-foreground">
        {COMMISSION_TYPE_LABELS[recipient.commission_type]}
      </p>
    </div>
  );
}

export function EditPlanCommissionModal(props: CommissionModalProps) {
  const configMutation = useEditUserPlanCommissionConfig();
  const recipientsMutation = useEditUserPlanCommissionRecipients();
  const agencies = useAgencies({ page: 1, limit: 100, status: 'active' });
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState<EditableRecipient[]>(() =>
    editableRecipients(props.recipients),
  );

  const agencyNames = useMemo(
    () => new Map((agencies.data?.items ?? []).map((agency) => [agency.id, agency.name])),
    [agencies.data?.items],
  );

  const updateRow = (index: number, patch: Partial<EditableRecipient>) =>
    setRows((current) =>
      current.map((recipient, rowIndex) =>
        rowIndex === index ? { ...recipient, ...patch } : recipient,
      ),
    );

  const parsedRates = rows.map((row) => Number(row.rate_percent));
  const ratesAreValid = parsedRates.every(
    (rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100,
  );
  const totalRate = parsedRates.reduce((sum, rate) => sum + (Number.isFinite(rate) ? rate : 0), 0);
  const identitiesAreValid = rows.every((row) =>
    row.commission_type === 'agency' ? Boolean(row.agency_id) : Boolean(row.user_id),
  );
  const pending = configMutation.isPending || recipientsMutation.isPending;

  const submit = async () => {
    if (!ratesAreValid) {
      toast.error('Every commission rate must be between 0% and 100%.');
      return;
    }
    if (totalRate > 100) {
      toast.error('The combined commission rate cannot exceed 100%.');
      return;
    }
    if (props.mode === 'recipients' && !identitiesAreValid) {
      toast.error('Select a user or agency for every commission recipient.');
      return;
    }

    try {
      if (props.mode === 'config') {
        const recipientRateUpdates = rows.flatMap((row, index) => {
          const newRate = parsedRates[index] / 100;
          const currentRate = props.recipients[index]?.rate;
          return currentRate !== undefined && Math.abs(currentRate - newRate) > 0.000001
            ? [{ index, new_rate: newRate }]
            : [];
        });
        if (!recipientRateUpdates.length) {
          toast.error('Change at least one rate before saving.');
          return;
        }
        const payload = AdminEditPlanCommissionConfigPayloadSchema.parse({
          reason,
          expected_updated_at: props.expectedUpdatedAt,
          recipient_rate_updates: recipientRateUpdates,
        });
        await configMutation.mutateAsync({
          userId: props.userId,
          planId: props.planId,
          payload,
        });
      } else {
        const newRecipients = rows.map((row, index) => ({
          commission_type: row.commission_type,
          user_id: row.commission_type === 'agency' ? undefined : row.user_id,
          agency_id: row.commission_type === 'agency' ? row.agency_id : undefined,
          rate: parsedRates[index] / 100,
          tier_at_creation: row.tier_at_creation || undefined,
          override_source: row.override_source || undefined,
        }));
        const payload = AdminEditPlanCommissionRecipientsPayloadSchema.parse({
          reason,
          expected_updated_at: props.expectedUpdatedAt,
          operation: 'replace',
          new_recipients: newRecipients,
        });
        await recipientsMutation.mutateAsync({
          userId: props.userId,
          planId: props.planId,
          payload,
        });
      }
      toast.success(
        props.mode === 'config' ? 'Commission rates updated' : 'Commission recipients updated',
      );
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update frozen commission snapshot'));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {props.mode === 'config' ? 'Edit commission rates' : 'Edit commission recipients'}
          </DialogTitle>
          <DialogDescription>
            This changes future commission processing for this plan. Commission already paid will
            not be changed.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 p-1">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span>Frozen configuration version</span>
              <span className="font-medium">{props.commissionConfigVersion ?? 'Not set'}</span>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {props.mode === 'config'
                  ? 'This plan has no commission recipients. Add recipients before editing rates.'
                  : 'No one is currently configured to receive commission on this plan.'}
              </div>
            ) : null}

            {props.mode === 'config'
              ? rows.map((recipient, index) => (
                  <div
                    key={`${recipient.commission_type}-${recipient.user_id || recipient.agency_id}-${index}`}
                    className="grid items-center gap-3 rounded-md border p-3 sm:grid-cols-[1fr_150px]"
                  >
                    <RecipientIdentity
                      recipient={recipient}
                      agencyName={agencyNames.get(recipient.agency_id)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={`commission-rate-${index}`}>Rate (%)</Label>
                      <Input
                        id={`commission-rate-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={recipient.rate_percent}
                        onChange={(event) =>
                          updateRow(index, { rate_percent: event.target.value })
                        }
                      />
                    </div>
                  </div>
                ))
              : rows.map((recipient, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Recipient {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove recipient ${index + 1}`}
                        onClick={() =>
                          setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Commission type</Label>
                        <Select
                          value={recipient.commission_type}
                          onValueChange={(value) =>
                            updateRow(index, {
                              commission_type:
                                value as UserAssetCommissionRecipient['commission_type'],
                              user_id: '',
                              agency_id: '',
                              user_label: undefined,
                            })
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(COMMISSION_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{recipient.commission_type === 'agency' ? 'Agency' : 'Person'}</Label>
                        {recipient.commission_type === 'agency' ? (
                          <Select
                            value={recipient.agency_id}
                            onValueChange={(agencyId) => updateRow(index, { agency_id: agencyId })}
                          >
                            <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                            <SelectContent>
                              {(agencies.data?.items ?? []).map((agency) => (
                                <SelectItem key={agency.id} value={agency.id}>
                                  {agency.name} ({agency.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <RecipientUserPicker
                            recipient={recipient}
                            onChange={(userId, label, tier) =>
                              updateRow(index, {
                                user_id: userId,
                                user_label: label,
                                tier_at_creation: tier ?? recipient.tier_at_creation,
                              })
                            }
                          />
                        )}
                      </div>
                      <div className="space-y-2 sm:max-w-[180px]">
                        <Label htmlFor={`recipient-rate-${index}`}>Rate (%)</Label>
                        <Input
                          id={`recipient-rate-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={recipient.rate_percent}
                          onChange={(event) =>
                            updateRow(index, { rate_percent: event.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

            {props.mode === 'recipients' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setRows((current) => [
                    ...current,
                    {
                      commission_type: 'direct',
                      user_id: '',
                      agency_id: '',
                      rate: 0,
                      rate_percent: '0',
                    },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />Add recipient
              </Button>
            ) : null}

            <div
              className={`flex justify-between rounded-md px-3 py-2 text-sm ${
                totalRate > 100 ? 'bg-destructive/10 text-destructive' : 'bg-muted/40'
              }`}
            >
              <span>Total commission</span>
              <span className="font-semibold">{totalRate.toFixed(2)}%</span>
            </div>

            <div className="space-y-2">
              <Label>Reason for this change</Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this commission change is necessary"
              />
              <p className="text-xs text-muted-foreground">Minimum 30 characters.</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              pending ||
              reason.trim().length < 30 ||
              !ratesAreValid ||
              totalRate > 100 ||
              (props.mode === 'config' && rows.length === 0) ||
              (props.mode === 'recipients' && !identitiesAreValid)
            }
            onClick={submit}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save commission changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

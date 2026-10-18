'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
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
import type { UserAsset } from '@/lib/api/admin/user-assets.types';

import { useUpdateUserPlanSpec } from '../../hooks/use-user-plan-mutations';
import {
  AdminUpdatePlanSpecPayloadSchema,
  type AdminUpdatePlanSpecPayload,
} from '../../schemas/user-plan-actions.schema';
import { getErrorMessage } from '../../utils/error-message';

interface EditUserPaymentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UserAsset;
  userId: string;
}

export function EditUserPaymentPlanModal({
  isOpen,
  onClose,
  asset,
  userId,
}: EditUserPaymentPlanModalProps) {
  const pd = asset.payment_details!;
  const isFlex = pd.asset_type === 'flex';
  const mutation = useUpdateUserPlanSpec();
  const form = useForm<AdminUpdatePlanSpecPayload>({
    resolver: zodResolver(AdminUpdatePlanSpecPayloadSchema),
  });
  const paymentType = useWatch({ control: form.control, name: 'new_payment_type' });
  const notifyUser = useWatch({ control: form.control, name: 'notify_user' });

  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      reason: '',
      notify_user: false,
      expected_updated_at: asset.updated_at,
      new_size_sqm: pd.size,
      new_number_of_units: pd.no_of_units,
      new_asset_price: isFlex ? pd.asset_price : undefined,
      new_land_price: isFlex ? undefined : pd.fullownerhsip_landprice,
      new_document_price: isFlex ? undefined : pd.fullownerhsip_documentprice,
      new_initial_payment: pd.initial_payment,
      new_monthly_payment: pd.amount_payable,
      new_tenor_months: pd.month_subscription,
      new_payment_type:
        pd.payment_type === 'all-inclusive' || pd.payment_type === 'partially-inclusive'
          ? pd.payment_type
          : undefined,
    });
  }, [asset.updated_at, form, isFlex, isOpen, pd]);

  const submit = async (payload: AdminUpdatePlanSpecPayload) => {
    try {
      await mutation.mutateAsync({ userId, planId: asset._id, payload });
      toast.success('Payment plan specification updated');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update payment plan'));
    }
  };

  const numberField = (name: keyof AdminUpdatePlanSpecPayload, label: string) => (
    <div className="space-y-2" key={name}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        min="0"
        step="any"
        {...form.register(name, { valueAsNumber: true })}
      />
      {form.formState.errors[name] && (
        <p className="text-sm text-red-500">{form.formState.errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit payment plan specification</DialogTitle>
          <DialogDescription>
            Pricing and schedule changes are recalculated by the backend. Recorded payments are changed through “Adjust Recorded Payment”.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)}>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="grid grid-cols-1 gap-4 p-1 md:grid-cols-2 lg:grid-cols-3">
              {numberField('new_size_sqm', 'Size (sqm)')}
              {numberField('new_number_of_units', 'Number of units')}
              {isFlex
                ? numberField('new_asset_price', 'Total asset price')
                : numberField('new_land_price', 'Land price')}
              {!isFlex && numberField('new_document_price', 'Document price')}
              {numberField('new_initial_payment', 'Initial payment')}
              {numberField('new_monthly_payment', 'Monthly payment')}
              {numberField('new_tenor_months', 'Land tenor (months)')}
              {!isFlex && numberField('new_document_monthly_payment', 'Document monthly payment')}
              {!isFlex && numberField('new_document_tenor_months', 'Document tenor (months)')}
              {!isFlex && (
                <div className="space-y-2">
                  <Label>Payment type</Label>
                  <Select
                    value={paymentType}
                    onValueChange={(value) =>
                      form.setValue(
                        'new_payment_type',
                        value as 'all-inclusive' | 'partially-inclusive',
                      )
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-inclusive">All-inclusive</SelectItem>
                      <SelectItem value="partially-inclusive">Partially-inclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-4 px-1 pt-4">
              <div className="space-y-2">
                <Label htmlFor="plan-spec-reason">Reason</Label>
                <Textarea
                  id="plan-spec-reason"
                  {...form.register('reason')}
                  placeholder="Explain why the plan contract is changing"
                />
                <p className="text-xs text-muted-foreground">Minimum 30 characters.</p>
                {form.formState.errors.reason && (
                  <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(notifyUser)}
                  onCheckedChange={(checked) => form.setValue('notify_user', checked === true)}
                />
                Notify user by email
              </label>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

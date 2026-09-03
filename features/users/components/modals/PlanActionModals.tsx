'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  useAdjustUserPlanBalance,
  useCloseUserPlan,
  useDeleteUserPlan,
  useOverrideUserPlanPaymentDate,
  useSendUserPlanSignatureReminder,
} from '../../hooks/use-user-plan-mutations';
import { getErrorMessage } from '../../utils/error-message';

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  planId: string;
  expectedUpdatedAt?: string;
};

function NotifyToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      Notify user by email
    </label>
  );
}

export function PlanBalanceAdjustmentModal(props: BaseProps) {
  const mutation = useAdjustUserPlanBalance();
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);

  const submit = async () => {
    try {
      await mutation.mutateAsync({
        userId: props.userId,
        planId: props.planId,
        payload: {
          direction,
          amount: Number(amount.replace(/,/g, '')),
          reason,
          notify_user: notify,
          expected_updated_at: props.expectedUpdatedAt,
        },
      });
      toast.success('Plan balance adjusted');
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to adjust plan balance'));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust plan balance</DialogTitle>
          <DialogDescription>
            Credit records more money paid; debit reverses money previously recorded as paid. A ledger transaction is always created.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(value) => setDirection(value as 'credit' | 'debit')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit plan (increase amount paid)</SelectItem>
                <SelectItem value="debit">Debit plan (reduce amount paid)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-adjust-amount">Amount (NGN)</Label>
            <Input id="plan-adjust-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-adjust-reason">Reason</Label>
            <Textarea id="plan-adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum 20 characters.</p>
          </div>
          <NotifyToggle checked={notify} onChange={setNotify} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button disabled={mutation.isPending || !Number(amount.replace(/,/g, '')) || reason.trim().length < 20} onClick={submit}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlanPaymentDateModal(props: BaseProps) {
  const mutation = useOverrideUserPlanPaymentDate();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);

  const submit = async () => {
    try {
      await mutation.mutateAsync({
        userId: props.userId,
        planId: props.planId,
        payload: {
          new_date: new Date(`${date}T12:00:00`).toISOString(),
          reason,
          notify_user: notify,
          expected_updated_at: props.expectedUpdatedAt,
        },
      });
      toast.success('Next payment date updated');
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update payment date'));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override next payment date</DialogTitle>
          <DialogDescription>The backend only accepts a future date.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="next-plan-payment">New date</Label>
            <Input id="next-plan-payment" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next-plan-payment-reason">Reason</Label>
            <Textarea id="next-plan-payment-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum 20 characters.</p>
          </div>
          <NotifyToggle checked={notify} onChange={setNotify} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button disabled={mutation.isPending || !date || reason.trim().length < 20} onClick={submit}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClosePlanModal(props: BaseProps) {
  const mutation = useCloseUserPlan();
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);

  const submit = async () => {
    try {
      await mutation.mutateAsync({
        userId: props.userId,
        planId: props.planId,
        payload: {
          reason,
          notify_user: notify,
          expected_updated_at: props.expectedUpdatedAt,
        },
      });
      toast.success('Payment plan closed');
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to close payment plan'));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close payment plan</DialogTitle>
          <DialogDescription>This closes the plan without deleting its audit history.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="close-plan-reason">Reason</Label>
            <Textarea id="close-plan-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum 30 characters.</p>
          </div>
          <NotifyToggle checked={notify} onChange={setNotify} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={mutation.isPending || reason.trim().length < 30} onClick={submit}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Close plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeletePlanModal(props: BaseProps) {
  const mutation = useDeleteUserPlan();
  const [reason, setReason] = useState('');
  const [refund, setRefund] = useState(true);
  const [freeInventory, setFreeInventory] = useState(true);
  const [notify, setNotify] = useState(true);

  const submit = async () => {
    try {
      await mutation.mutateAsync({
        userId: props.userId,
        planId: props.planId,
        payload: {
          reason,
          refund_to_wallet: refund,
          free_inventory: freeInventory,
          notify_user: notify,
          expected_updated_at: props.expectedUpdatedAt,
        },
      });
      toast.success('Payment plan deleted');
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete payment plan'));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete payment plan</DialogTitle>
          <DialogDescription>The plan is soft-deleted. Choose whether to refund and release its inventory.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-plan-reason">Reason</Label>
            <Textarea id="delete-plan-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum 30 characters.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={refund} onCheckedChange={(v) => setRefund(v === true)} /> Refund paid amount to wallet
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={freeInventory} onCheckedChange={(v) => setFreeInventory(v === true)} /> Release asset inventory
          </label>
          <NotifyToggle checked={notify} onChange={setNotify} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={mutation.isPending || reason.trim().length < 30} onClick={submit}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SignatureReminderModal(props: Omit<BaseProps, 'expectedUpdatedAt'>) {
  const mutation = useSendUserPlanSignatureReminder();

  const submit = async () => {
    try {
      await mutation.mutateAsync({ userId: props.userId, planId: props.planId, payload: {} });
      toast.success('Signature reminder queued');
      props.onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to send signature reminder'));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send signature reminder</DialogTitle>
          <DialogDescription>Send the user an immediate reminder to sign this plan&apos;s legal document.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

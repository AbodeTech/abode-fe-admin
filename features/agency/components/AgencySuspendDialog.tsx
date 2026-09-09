"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useSuspendAgency } from "../hooks/use-agency-actions";
import {
  SUSPENSION_REASON_MAX,
  SUSPENSION_REASON_MIN,
  suspendAgencySchema,
} from "../schemas/agency.schema";
import { getErrorMessage } from "../utils/error-message";

/**
 * POST /admin/agencies/:id/suspend.
 *
 * The reason is audited, so the 20-character floor is a real requirement
 * rather than UI garnish. It is checked against the *trimmed* length in two
 * places on the BE, so the counter here trims too.
 */
interface AgencySuspendDialogProps {
  agencyId: string;
  agencyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Separate so Radix's unmount-on-close clears the reason between opens. */
function SuspendForm({
  agencyId,
  agencyName,
  onDone,
}: {
  agencyId: string;
  agencyName: string;
  onDone: () => void;
}) {
  const { mutateAsync: suspendAgency, isPending } = useSuspendAgency();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = reason.trim().length;
  const remaining = SUSPENSION_REASON_MIN - trimmedLength;

  const handleSubmit = async () => {
    const parsed = suspendAgencySchema.safeParse({ suspension_reason: reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid reason");
      return;
    }

    try {
      await suspendAgency({ agencyId, payload: parsed.data });
      toast.success(`${agencyName} suspended`);
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to suspend agency"));
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="suspension-reason">Reason for suspension</Label>
        <Textarea
          id="suspension-reason"
          rows={4}
          maxLength={SUSPENSION_REASON_MAX}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError(null);
          }}
          disabled={isPending}
          placeholder="Recorded in the audit log — explain why this agency is being suspended."
        />
        <p className="text-xs text-muted-foreground">
          {remaining > 0
            ? `${remaining} more character${remaining === 1 ? "" : "s"} needed`
            : `${trimmedLength} / ${SUSPENSION_REASON_MAX}`}
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleSubmit}
          disabled={isPending || remaining > 0}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Suspend agency
        </Button>
      </DialogFooter>
    </>
  );
}

export function AgencySuspendDialog({
  agencyId,
  agencyName,
  open,
  onOpenChange,
}: AgencySuspendDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {agencyName}</DialogTitle>
          <DialogDescription>
            New commission stops routing to this agency and falls back to the normal tier
            chain. Commission already earned is unaffected, and members keep their accounts.
          </DialogDescription>
        </DialogHeader>

        <SuspendForm
          agencyId={agencyId}
          agencyName={agencyName}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

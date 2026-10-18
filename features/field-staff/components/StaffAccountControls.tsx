"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Mail, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import type { FieldStaff } from "../schemas/field-staff.schema";
import { useDisableFieldStaff, useEnableFieldStaff, useResendFieldInvite } from "../hooks/use-field-staff-mutations";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

const ACCOUNT_STYLES: Record<FieldStaff["status"], { label: string; className: string }> = {
  invited: { label: "Invited", className: "bg-blue-50 text-blue-700" },
  active: { label: "Active", className: "bg-[#E0F2F1] text-[#00695C]" },
  disabled: { label: "Disabled", className: "bg-muted text-muted-foreground" },
};

export function StaffStatusBadge({ status, className }: { status: FieldStaff["status"]; className?: string }) {
  const style = ACCOUNT_STYLES[status];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", style.className, className)}>{style.label}</span>
  );
}

/**
 * Account actions for one person: a visible "Resend invitation" while they're
 * invited (it's what they usually need), and a Manage menu holding the rest.
 * Disabling signs them out everywhere and keeps every record.
 */
export function StaffAccountMenu({ staff }: { staff: FieldStaff }) {
  const [disableOpen, setDisableOpen] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);
  const [reason, setReason] = useState("");
  const disable = useDisableFieldStaff();
  const enable = useEnableFieldStaff();
  const resend = useResendFieldInvite();
  const busy = disable.isPending || enable.isPending || resend.isPending;

  const doDisable = () => {
    if (!reason.trim()) {
      toast.error("Add a reason to disable the account");
      return;
    }
    disable.mutate(
      { staffId: staff.id, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success(`${staff.full_name} disabled and signed out everywhere`);
          setReason("");
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  const doEnable = () =>
    enable.mutate(staff.id, {
      onSuccess: (updated) =>
        toast.success(
          updated.status === "active"
            ? `${staff.full_name} re-enabled`
            : `${staff.full_name} re-enabled. They still need to use their invitation link.`
        ),
      onError: (error) => toast.error(error.message),
    });

  const doResend = () =>
    resend.mutate(staff.id, {
      onSuccess: () =>
        toast.success(`A new invitation was sent to ${staff.email}`, {
          description: "The previous activation link no longer works.",
        }),
      onError: (error) => toast.error(error.message),
    });

  return (
    <>
      {staff.status === "invited" && (
        <Button variant="outline" onClick={doResend} disabled={busy}>
          {resend.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}
          Resend invitation
        </Button>
      )}

      {/* Non-modal so opening a confirm dialog from an item doesn't leave the page locked. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={busy}>
            {busy && !resend.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Manage
            <ChevronDown className="ml-1.5 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {staff.status === "invited" && (
            <>
              <DropdownMenuItem onSelect={doResend}>
                <Mail />
                Resend invitation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {staff.status === "disabled" ? (
            <DropdownMenuItem onSelect={() => setEnableOpen(true)}>
              <UserCheck />
              Re-enable account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={() => setDisableOpen(true)}>
              <UserX />
              Disable account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={disableOpen}
        onOpenChange={(next) => {
          setDisableOpen(next);
          if (!next) setReason("");
        }}
        title={`Disable ${staff.full_name}?`}
        description="They're signed out of every device straight away. Their assignments, work, targets and scores all stay on record."
        confirmLabel="Disable account"
        onConfirm={doDisable}
      >
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="e.g. Left the company"
          aria-label="Reason for disabling"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={enableOpen}
        onOpenChange={setEnableOpen}
        title={`Re-enable ${staff.full_name}?`}
        description={
          staff.activated_at
            ? "They can sign in to the field app again and see the sites they're assigned to."
            : "They never activated, so the account goes back to invited. Resend the invitation if the old link has expired."
        }
        confirmLabel="Re-enable"
        destructive={false}
        onConfirm={doEnable}
      />
    </>
  );
}

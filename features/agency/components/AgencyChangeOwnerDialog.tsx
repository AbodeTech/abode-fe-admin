"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPicker } from "@/components/shared/UserPicker";

import { useChangeAgencyOwner } from "../hooks/use-agency-actions";
import { getErrorMessage } from "../utils/error-message";

/**
 * POST /admin/agencies/:id/change-owner — super admin only.
 *
 * The incoming user must not already own another agency, and is moved into
 * this one as a side effect. Only render this behind
 * `user.role?.is_super_admin`: the BE's SuperAdminGuard 403s otherwise, and
 * showing an action that always fails is worse than hiding it.
 */
interface AgencyChangeOwnerDialogProps {
  agencyId: string;
  currentOwnerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Separate so Radix's unmount-on-close clears the picked user between opens. */
function ChangeOwnerForm({
  agencyId,
  currentOwnerName,
  onDone,
}: {
  agencyId: string;
  currentOwnerName: string;
  onDone: () => void;
}) {
  const { mutateAsync: changeOwner, isPending } = useChangeAgencyOwner();
  const [userId, setUserId] = useState("");
  const [retain, setRetain] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userId) {
      setError("Pick the incoming owner");
      return;
    }

    try {
      await changeOwner({
        agencyId,
        payload: { new_owner_user_id: userId, retain_old_owner_as_member: retain },
      });
      toast.success("Agency owner changed");
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change owner"));
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>New owner</Label>
          <UserPicker
            value={userId}
            onChange={(id) => {
              setUserId(id);
              setError(null);
            }}
            disabled={isPending}
            placeholder="Search for the incoming owner"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="retain-owner"
            checked={retain}
            onCheckedChange={(checked) => setRetain(checked === true)}
            disabled={isPending}
          />
          <div className="space-y-1">
            <Label htmlFor="retain-owner" className="font-normal">
              Keep {currentOwnerName} as a member
            </Label>
            <p className="text-xs text-muted-foreground">
              Unchecked, they are removed from the agency entirely.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending || !userId}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Change owner
        </Button>
      </DialogFooter>
    </>
  );
}

export function AgencyChangeOwnerDialog({
  agencyId,
  currentOwnerName,
  open,
  onOpenChange,
}: AgencyChangeOwnerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change agency owner</DialogTitle>
          <DialogDescription>
            {currentOwnerName} currently owns this agency. The incoming owner must not
            already own another one, and joins this agency as part of the change.
          </DialogDescription>
        </DialogHeader>

        <ChangeOwnerForm
          agencyId={agencyId}
          currentOwnerName={currentOwnerName}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

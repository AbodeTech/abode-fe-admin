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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useUpdateAgency } from "../hooks/use-agency-actions";
import {
  updateAgencySchema,
  type AgencyDetail,
  type UpdateAgencyPayload,
} from "../schemas/agency.schema";
import { getErrorMessage } from "../utils/error-message";

/**
 * PATCH /admin/agencies/:id.
 *
 * Only changed fields are sent — the BE diffs anyway, but `forbidNonWhitelisted`
 * makes a minimal body the safer habit. A contact field the admin cleared goes
 * as an explicit `null` (that's how the BE unsets it); one left untouched is
 * omitted entirely.
 */
type EditableAgency = Pick<
  AgencyDetail,
  "id" | "name" | "commission_percentage" | "contact_email" | "contact_phone"
>;

interface AgencyEditDialogProps {
  agency: EditableAgency;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The form lives in its own component so Radix's unmount-on-close reseeds it
 * from `agency` on every open — a cancelled edit leaves nothing behind, with
 * no reset effect to keep in sync.
 */
function EditAgencyForm({
  agency,
  onDone,
}: {
  agency: EditableAgency;
  onDone: () => void;
}) {
  const { mutateAsync: updateAgency, isPending } = useUpdateAgency();

  const [name, setName] = useState(agency.name);
  const [commission, setCommission] = useState(String(agency.commission_percentage));
  const [email, setEmail] = useState(agency.contact_email ?? "");
  const [phone, setPhone] = useState(agency.contact_phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const payload: UpdateAgencyPayload = {};

    if (name.trim() !== agency.name) payload.name = name.trim();

    const rate = Number(commission);
    if (!Number.isFinite(rate)) {
      setErrors({ commission_percentage: "Enter a valid commission rate" });
      return;
    }
    if (rate !== agency.commission_percentage) payload.commission_percentage = rate;

    const nextEmail = email.trim();
    if (nextEmail !== (agency.contact_email ?? "")) {
      payload.contact_email = nextEmail === "" ? null : nextEmail;
    }

    const nextPhone = phone.trim();
    if (nextPhone !== (agency.contact_phone ?? "")) {
      payload.contact_phone = nextPhone === "" ? null : nextPhone;
    }

    if (Object.keys(payload).length === 0) {
      onDone();
      return;
    }

    const parsed = updateAgencySchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      return;
    }

    try {
      await updateAgency({ agencyId: agency.id, payload: parsed.data });
      toast.success("Agency updated");
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update agency"));
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agency-name">Agency name</Label>
          <Input
            id="agency-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-commission">Commission percentage</Label>
          <Input
            id="agency-commission"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={commission}
            onChange={(event) => setCommission(event.target.value)}
            disabled={isPending}
          />
          {errors.commission_percentage && (
            <p className="text-sm text-destructive">{errors.commission_percentage}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-email">Contact email</Label>
          <Input
            id="agency-email"
            type="email"
            placeholder="Leave blank to clear"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
          />
          {errors.contact_email && (
            <p className="text-sm text-destructive">{errors.contact_email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-phone">Contact phone</Label>
          <Input
            id="agency-phone"
            placeholder="Leave blank to clear"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isPending}
          />
          {errors.contact_phone && (
            <p className="text-sm text-destructive">{errors.contact_phone}</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </>
  );
}

export function AgencyEditDialog({ agency, open, onOpenChange }: AgencyEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit agency</DialogTitle>
          <DialogDescription>
            Update the name, commission rate or contact details. The agency code and owner
            are changed elsewhere.
          </DialogDescription>
        </DialogHeader>

        <EditAgencyForm agency={agency} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

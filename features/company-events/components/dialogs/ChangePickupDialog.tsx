"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSetAttendeePickup } from "../../hooks/use-attendee-actions";
import type { EventPickupOption } from "./RegisterAttendeeDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  attendee: { id: string; name: string | null; pickup_location: string | null; status: string } | null;
  pickupLocations: EventPickupOption[];
}

/**
 * Move one attendee to a different stop.
 *
 * The registration form is single-use, so a pickup point chosen once could
 * never be changed — which is exactly what stranded everyone on a withdrawn
 * stop with nowhere to be and no way to say so.
 *
 * Their pass names the stop, so a corrected one is sent by default. The
 * checkbox is for the case where they have already been told by phone and a
 * second email would only confuse.
 */
export function ChangePickupDialog({
  open,
  onOpenChange,
  eventId,
  attendee,
  pickupLocations,
}: Props) {
  const { mutateAsync, isPending } = useSetAttendeePickup();
  const [pickup, setPickup] = useState("");
  const [notify, setNotify] = useState(true);

  // Adjusted during render rather than in an effect, as elsewhere: a dialog
  // reopened on somebody else must not keep the last person's answers.
  const openFor = open ? attendee?.id ?? null : null;
  const [lastOpenFor, setLastOpenFor] = useState<string | null>(openFor);
  if (openFor !== lastOpenFor) {
    setLastOpenFor(openFor);
    setPickup("");
    setNotify(true);
  }

  // Somebody still invited holds no pass, so there is nothing to correct and
  // the option would promise an email that will not be sent.
  const holdsAPass = attendee?.status !== "invited";

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!attendee || !pickup) return;
    try {
      const result = await mutateAsync({
        eventId,
        registrationId: attendee.id,
        pickupLocationId: pickup,
        notify: holdsAPass ? notify : false,
      });
      const out = result.setAttendeePickup;
      toast.success(
        out.pass_sent
          ? `Moved to ${out.pickup_location} — a corrected pass has been sent`
          : `Moved to ${out.pickup_location}`
      );
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message || "Could not change the pickup point");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change pickup point</DialogTitle>
          <DialogDescription>
            {attendee?.pickup_location
              ? `${attendee.name ?? "This attendee"} is currently on ${attendee.pickup_location}.`
              : `${attendee?.name ?? "This attendee"} has no pickup point yet.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-pickup">New pickup point</Label>
            <Select value={pickup} onValueChange={setPickup}>
              <SelectTrigger id="new-pickup" className="w-full">
                <SelectValue placeholder="Choose a stop" />
              </SelectTrigger>
              <SelectContent>
                {pickupLocations.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {holdsAPass && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="notify-pickup"
                checked={notify}
                onCheckedChange={(v) => setNotify(v === true)}
              />
              <Label htmlFor="notify-pickup" className="text-sm font-normal leading-snug">
                Send a corrected pass
                <span className="block text-xs text-muted-foreground">
                  Their current QR email names the old stop.
                </span>
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !pickup}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

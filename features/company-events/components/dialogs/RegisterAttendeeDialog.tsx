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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegisterAttendeeOnBehalf } from "../../hooks/use-attendee-actions";

export interface AttendeeToRegister {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  /** form | account | none — whether these details are theirs or their account's. */
  contact_source?: string;
}

export interface EventPickupOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  attendee: AttendeeToRegister | null;
  pickupLocations: EventPickupOption[];
}

const CATEGORIES = [
  { value: "client", label: "Client" },
  { value: "associate", label: "Associate" },
  { value: "associate_pro", label: "Associate Pro" },
];

/** The server's own default, left unset unless an admin picks otherwise. */
const FROM_ACCOUNT = "from_account";

/**
 * Register somebody who confirmed by phone.
 *
 * The public form is token-gated and single-use, so a confirmation that arrives
 * any other way — to a realtor, over the phone, in a WhatsApp reply — had
 * nowhere to go, and those seats stayed "invited" while the buses were planned
 * without them.
 *
 * The pickup point is the only field that starts empty, because it is the only
 * one the customer alone knows. Everything else is prefilled from their account
 * and editable, and the category defaults from their referral status server-side
 * rather than being guessed here.
 */
export function RegisterAttendeeDialog({
  open,
  onOpenChange,
  eventId,
  attendee,
  pickupLocations,
}: Props) {
  const { mutateAsync, isPending } = useRegisterAttendeeOnBehalf();

  const [pickup, setPickup] = useState("");
  const [category, setCategory] = useState(FROM_ACCOUNT);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Reset per attendee: a dialog reopened on somebody else must not carry the
  // previous person's pickup point, which is the one field that would be wrong
  // in a way nobody notices.
  //
  // Adjusted during render rather than in an effect — React re-renders before
  // committing, so there is no flash of the previous attendee's details.
  const openFor = open ? attendee?.id ?? null : null;
  const [lastOpenFor, setLastOpenFor] = useState<string | null>(openFor);
  if (openFor !== lastOpenFor) {
    setLastOpenFor(openFor);
    setPickup("");
    setCategory(FROM_ACCOUNT);
    setName(attendee?.name ?? "");
    setPhone(attendee?.phone ?? "");
    setEmail(attendee?.email ?? "");
  }

  const needsPickup = pickupLocations.length > 0;
  const canSubmit = !isPending && (!needsPickup || !!pickup) && !!email.trim() && !!name.trim();

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleRegister = async () => {
    if (!attendee) return;
    try {
      const result = await mutateAsync({
        eventId,
        registrationId: attendee.id,
        pickupLocationId: pickup || undefined,
        category: category === FROM_ACCOUNT ? undefined : category,
        name,
        phone,
        email,
      });
      const out = result.registerAttendeeOnBehalf;
      toast.success(
        out.pass_sent
          ? `${out.registration.name} registered — their QR code is on its way`
          : // Said plainly rather than swallowed: they ARE registered, and
            // somebody has to know the pass did not go out.
            `${out.registration.name} registered, but the pass email failed to send`
      );
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message || "Could not register this attendee");
    }
  };

  const fromAccount = attendee?.contact_source === "account";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register on their behalf</DialogTitle>
          <DialogDescription>
            For someone who confirmed by phone. They will be emailed their QR code straight
            away, which they can forward to anyone attending in their place.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="attendee-pickup">
              Pickup point {needsPickup && <span className="text-destructive">*</span>}
            </Label>
            <Select value={pickup} onValueChange={setPickup} disabled={!needsPickup}>
              <SelectTrigger id="attendee-pickup" className="w-full">
                <SelectValue
                  placeholder={needsPickup ? "Where are we collecting them?" : "This event has no pickup points"}
                />
              </SelectTrigger>
              <SelectContent>
                {pickupLocations.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The one thing only they can tell us — the buses are planned from this.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendee-name">Name</Label>
            <Input
              id="attendee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="attendee-email">Email</Label>
              <Input
                id="attendee-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Where the pass goes"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attendee-phone">Phone</Label>
              <Input
                id="attendee-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {fromAccount && (
            <p className="text-xs text-muted-foreground">
              These details come from their account — correct them here if they are out of date.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="attendee-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="attendee-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FROM_ACCOUNT}>From their account</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleRegister} disabled={!canSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Register and send pass
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

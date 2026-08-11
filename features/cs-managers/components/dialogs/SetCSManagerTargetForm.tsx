"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { useAssignCSManagerTarget } from "../../hooks/use-cs-manager-mutations";
import type { CsManagerTargetType } from "@/lib/gql/graphql";

interface Props {
  managerId: string | null;
  existing?: CsManagerTargetType | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Rolling 12-month picker starting from the current month.
const buildMonthOptions = () => {
  const opts: { value: string; label: string; month: number; year: number }[] =
    [];
  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    opts.push({
      value: `${year}-${String(month).padStart(2, "0")}`,
      label: `${months[month - 1]} ${year}`,
      month,
      year,
    });
  }
  return opts;
};

export function SetCSManagerTargetForm({
  managerId,
  existing,
  onSaved,
  onCancel,
}: Props) {
  const monthOptions = buildMonthOptions();

  const initialMonthValue = existing
    ? `${existing.year}-${String(existing.month).padStart(2, "0")}`
    : monthOptions[0].value;

  const [monthValue, setMonthValue] = useState(initialMonthValue);
  const [allocated, setAllocated] = useState<string>(
    existing ? String(existing.customers_allocated_target) : ""
  );
  const [onboarded, setOnboarded] = useState<string>(
    existing ? String(existing.customers_onboarded_target) : ""
  );
  const [deeds, setDeeds] = useState<string>(
    existing ? String(existing.deeds_delivered_target) : ""
  );

  const { mutateAsync, isPending } = useAssignCSManagerTarget();

  useEffect(() => {
    // Re-sync when the underlying target changes (create ↔ edit swap).
    setMonthValue(initialMonthValue);
    setAllocated(existing ? String(existing.customers_allocated_target) : "");
    setOnboarded(existing ? String(existing.customers_onboarded_target) : "");
    setDeeds(existing ? String(existing.deeds_delivered_target) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?._id]);

  // BE inputs are all optional (Int, not Int!), so partial targets are
  // fine — untargeted components read as "no target set" in the score
  // instead of being counted against.
  const canSave = !!managerId && !isPending;

  const handleSave = async () => {
    if (!managerId) return;

    const picked = monthOptions.find((o) => o.value === monthValue);
    // Editing an existing target locks its period to prevent accidental
    // month swaps — always overwrite in place for whatever month it's
    // already tied to.
    const month = existing ? existing.month : picked?.month;
    const year = existing ? existing.year : picked?.year;

    if (!month || !year) {
      toast.error("Pick a valid month");
      return;
    }

    // Blank input → omit the field so BE keeps whatever was there (or
    // defaults to 0 for a new record). Number("") === 0, which would
    // silently overwrite a good value with 0, so we explicitly drop
    // empties instead.
    const asNumber = (v: string): number | undefined =>
      v.trim() === "" ? undefined : Number(v);

    try {
      await mutateAsync({
        managerId,
        month,
        year,
        customers_allocated_target: asNumber(allocated),
        customers_onboarded_target: asNumber(onboarded),
        deeds_delivered_target: asNumber(deeds),
        // Peer rating deferred — omit so BE keeps whatever's there
        // (defaults to 0 on new records). Restore this input when the
        // rating loop lands.
      });
      toast.success(existing ? "Target updated" : "Target saved");
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save target");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <p className="text-sm font-medium text-gray-900">
        {existing ? "Edit target" : "Set target for new month"}
      </p>

      <div className="space-y-2">
        <Label>Month</Label>
        {existing ? (
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            {monthOptions.find((o) => o.value === initialMonthValue)?.label ??
              `${existing.month}/${existing.year}`}
            <span className="text-xs text-gray-400 ml-2">
              (period locked on edit)
            </span>
          </div>
        ) : (
          <Select value={monthValue} onValueChange={setMonthValue}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Pick a month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="allocated">
            Customers Allocated
            <span className="text-xs text-gray-400 ml-1">optional</span>
          </Label>
          <Input
            id="allocated"
            type="number"
            min={0}
            value={allocated}
            onChange={(e) => setAllocated(e.target.value)}
            placeholder="e.g. 30"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboarded">
            Customers Onboarded
            <span className="text-xs text-gray-400 ml-1">optional</span>
          </Label>
          <Input
            id="onboarded"
            type="number"
            min={0}
            value={onboarded}
            onChange={(e) => setOnboarded(e.target.value)}
            placeholder="e.g. 25"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deeds">
            Deeds Delivered
            <span className="text-xs text-gray-400 ml-1">optional</span>
          </Label>
          <Input
            id="deeds"
            type="number"
            min={0}
            value={deeds}
            onChange={(e) => setDeeds(e.target.value)}
            placeholder="e.g. 15"
            className="bg-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canSave} onClick={handleSave}>
          {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {existing ? "Save changes" : "Save target"}
        </Button>
      </div>
    </div>
  );
}

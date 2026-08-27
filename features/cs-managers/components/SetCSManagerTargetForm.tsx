"use client";

import { useState } from "react";
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
import { useUpsertCSManagerTarget } from "../hooks/use-cs-manager-mutations";
import type { CSManagerTarget } from "../schemas/cs-manager.schema";

interface Props {
  managerId: string | null;
  existing?: CSManagerTarget | null;
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * The caller must key this component by `existing?.id ?? "create"` so
 * switching between targets remounts it — state initializes from `existing`
 * once, on mount, rather than resyncing via an effect.
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const buildMonthOptions = () => {
  const opts: { value: string; label: string; month: number; year: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    opts.push({
      value: `${year}-${String(month).padStart(2, "0")}`,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      month,
      year,
    });
  }
  return opts;
};

export function SetCSManagerTargetForm({ managerId, existing, onSaved, onCancel }: Props) {
  const monthOptions = buildMonthOptions();

  const initialMonthValue = existing
    ? `${existing.year}-${String(existing.month).padStart(2, "0")}`
    : monthOptions[0].value;

  const [monthValue, setMonthValue] = useState(initialMonthValue);
  const [allocated, setAllocated] = useState<string>(
    existing ? String(existing.customers_allocated_target) : "0"
  );
  const [onboarded, setOnboarded] = useState<string>(
    existing ? String(existing.customers_onboarded_target) : "0"
  );
  const [deeds, setDeeds] = useState<string>(
    existing ? String(existing.deeds_delivered_target) : "0"
  );

  const upsertTarget = useUpsertCSManagerTarget();

  const canSave = !!managerId && !upsertTarget.isPending;

  const handleSave = () => {
    if (!managerId) return;

    const picked = monthOptions.find((o) => o.value === monthValue);
    const month = existing ? existing.month : picked?.month;
    const year = existing ? existing.year : picked?.year;

    if (!month || !year) {
      toast.error("Pick a valid month");
      return;
    }

    // AssignTargetDto requires all three — unlike main's GraphQL input, none are optional.
    const values = {
      customers_allocated_target: Number(allocated) || 0,
      customers_onboarded_target: Number(onboarded) || 0,
      deeds_delivered_target: Number(deeds) || 0,
    };

    upsertTarget.mutate(
      { managerId, year, month, values },
      {
        onSuccess: () => {
          toast.success(existing ? "Target updated" : "Target saved");
          onSaved();
        },
        onError: (error) => toast.error(error.message || "Failed to save target"),
      }
    );
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
            <span className="text-xs text-gray-400 ml-2">(period locked on edit)</span>
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
          <Label htmlFor="allocated">Customers Allocated</Label>
          <Input
            id="allocated"
            type="number"
            min={0}
            value={allocated}
            onChange={(e) => setAllocated(e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboarded">Customers Onboarded</Label>
          <Input
            id="onboarded"
            type="number"
            min={0}
            value={onboarded}
            onChange={(e) => setOnboarded(e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deeds">Deeds Delivered</Label>
          <Input
            id="deeds"
            type="number"
            min={0}
            value={deeds}
            onChange={(e) => setDeeds(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={upsertTarget.isPending}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canSave} onClick={handleSave}>
          {upsertTarget.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {existing ? "Save changes" : "Save target"}
        </Button>
      </div>
    </div>
  );
}

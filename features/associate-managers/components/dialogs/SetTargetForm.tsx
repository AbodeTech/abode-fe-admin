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
import { useAssignManagerTarget } from "../../hooks/use-assign-manager-target";
import type { AssociateManagerTargetType } from "@/lib/gql/graphql";

interface Props {
  managerId: string | null;
  existing?: AssociateManagerTargetType | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Build the next 12 months starting from the current month.
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

export function SetTargetForm({
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
  const [recruited, setRecruited] = useState<string>(
    existing ? String(existing.associate_pro_recruited_target) : ""
  );
  const [selling, setSelling] = useState<string>(
    existing ? String(existing.selling_associate_pro_target) : ""
  );
  const [score, setScore] = useState<string>(
    existing ? String(existing.performance_score_target) : ""
  );

  const { mutateAsync, isPending } = useAssignManagerTarget();

  useEffect(() => {
    // Re-sync when the existing target changes (e.g. switching between create/edit).
    setMonthValue(initialMonthValue);
    setRecruited(existing ? String(existing.associate_pro_recruited_target) : "");
    setSelling(existing ? String(existing.selling_associate_pro_target) : "");
    setScore(existing ? String(existing.performance_score_target) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?._id]);

  const canSave =
    !!managerId && recruited !== "" && selling !== "" && score !== "" && !isPending;

  const handleSave = async () => {
    if (!managerId) return;

    const picked = monthOptions.find((o) => o.value === monthValue);
    // When editing, the month/year are locked to the existing target's period.
    const month = existing ? existing.month : picked?.month;
    const year = existing ? existing.year : picked?.year;

    if (!month || !year) {
      toast.error("Pick a valid month");
      return;
    }

    try {
      await mutateAsync({
        managerId,
        month,
        year,
        associate_pro_recruited_target: Number(recruited),
        selling_associate_pro_target: Number(selling),
        performance_score_target: Number(score),
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
          <Label htmlFor="recruited">Ass. Pros Recruited</Label>
          <Input
            id="recruited"
            type="number"
            min={0}
            value={recruited}
            onChange={(e) => setRecruited(e.target.value)}
            placeholder="e.g. 15"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="selling">Selling Ass. Pros</Label>
          <Input
            id="selling"
            type="number"
            min={0}
            value={selling}
            onChange={(e) => setSelling(e.target.value)}
            placeholder="e.g. 12"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="score">Performance Score</Label>
          <Input
            id="score"
            type="number"
            min={0}
            step="1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="e.g. 8"
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

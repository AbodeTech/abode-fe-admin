"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialOfficerTargets } from "../hooks/use-financial-officer-targets";
import { useUpsertFinancialOfficerTarget } from "../hooks/use-financial-officer-mutations";
import { formatNaira } from "../lib/format";
import type { FinancialOfficerTarget } from "../schemas/financial-officer.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officerId: string;
  officerName: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const periodLabel = (month: number, year: number) => `${MONTH_NAMES[month - 1]} ${year}`;

/** This month and the next eleven — targets are set ahead, never backdated. */
const upcomingMonths = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });
};

type Editing = { month: number; year: number; existing: FinancialOfficerTarget | null } | null;

function TargetForm({
  officerId,
  editing,
  onDone,
}: {
  officerId: string;
  editing: NonNullable<Editing>;
  onDone: () => void;
}) {
  const months = upcomingMonths();
  const [period, setPeriod] = useState(`${editing.year}-${editing.month}`);
  const [amount, setAmount] = useState(editing.existing ? String(editing.existing.recovery_target) : "");
  const upsert = useUpsertFinancialOfficerTarget();

  const handleSave = () => {
    const [year, month] = period.split("-").map(Number);
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a recovery target in naira");
      return;
    }
    upsert.mutate(
      { officerId, year, month, values: { recovery_target: value } },
      {
        onSuccess: () => {
          toast.success(editing.existing ? "Target updated" : "Target saved");
          onDone();
        },
        onError: (err) => toast.error(err.message || "Failed to save target"),
      }
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Month</Label>
          {editing.existing ? (
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              {periodLabel(editing.month, editing.year)}
            </div>
          ) : (
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {periodLabel(m.month, m.year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recovery-target">Debt recovery target (₦)</Label>
          <Input
            id="recovery-target"
            type="number"
            min={0}
            step={50000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25000000"
            className="bg-white"
            autoFocus
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Approval time isn&apos;t set here: every officer is measured against the same 24 weekday-hour target.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={upsert.isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!amount || upsert.isPending}>
          {upsert.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {editing.existing ? "Save changes" : "Save target"}
        </Button>
      </div>
    </div>
  );
}

export function ManageFOTargetsDialog({ open, onOpenChange, officerId, officerName }: Props) {
  const { data: targets, isLoading } = useFinancialOfficerTargets(open ? officerId : null);
  const [editing, setEditing] = useState<Editing>(null);

  const sorted = useMemo(
    () => [...(targets ?? [])].sort((a, b) => b.year - a.year || b.month - a.month),
    [targets]
  );

  const now = new Date();
  const isCurrent = (t: FinancialOfficerTarget) => t.year === now.getFullYear() && t.month === now.getMonth() + 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setEditing(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#00695C]" />
            Recovery targets — {officerName}
          </DialogTitle>
          <DialogDescription>
            How much debt this officer should recover each month. Recovery is half of their score.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading targets…
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.length === 0 ? (
              <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                No targets set yet.
              </p>
            ) : (
              <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {sorted.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">
                        {periodLabel(t.month, t.year)}
                        {isCurrent(t) && (
                          <span className="ml-2 rounded-full bg-[#E0F2F1] px-2 py-0.5 text-[11px] font-medium text-[#00695C]">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 tabular-nums">{formatNaira(t.recovery_target)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing({ month: t.month, year: t.year, existing: t })}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {editing ? (
              <TargetForm
                key={`${editing.year}-${editing.month}-${editing.existing?.id ?? "new"}`}
                officerId={officerId}
                editing={editing}
                onDone={() => setEditing(null)}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                  setEditing({ month: now.getMonth() + 1, year: now.getFullYear(), existing: null })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Set target for a month
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

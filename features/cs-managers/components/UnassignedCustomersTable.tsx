"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { UnassignedCustomer } from "../types";

interface Props {
  customers: UnassignedCustomer[];
  onBulkAssign?: (customerIds: string[]) => void;
  onAssignOne?: (customer: UnassignedCustomer) => void;
}

const OVERDUE_THRESHOLD_DAYS = 7;

const timeAgo = (iso: string) => {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
};

const initialsOf = (c: UnassignedCustomer) =>
  ((c.lastName?.[0] ?? "") + (c.firstName?.[0] ?? "")).toUpperCase();

const fullName = (c: UnassignedCustomer) =>
  `${c.lastName ?? ""} ${c.firstName ?? ""}`.trim();

export function UnassignedCustomersTable({
  customers,
  onBulkAssign,
  onAssignOne,
}: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const sorted = useMemo(
    () =>
      [...customers].sort((a, b) => b.daysUnassigned - a.daysUnassigned),
    [customers]
  );

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const allSelected =
    sorted.length > 0 && sorted.every((c) => selected[c._id]);
  const overdueCount = sorted.filter(
    (c) => c.daysUnassigned >= OVERDUE_THRESHOLD_DAYS
  ).length;

  const toggleOne = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      sorted.forEach((c) => {
        next[c._id] = true;
      });
      setSelected(next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Users className="h-4 w-4 text-gray-400" />
            {sorted.length} customer{sorted.length === 1 ? "" : "s"} awaiting assignment
          </div>
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-[#AD1F2A] text-[11px] font-medium px-2 py-0.5">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount} overdue ({OVERDUE_THRESHOLD_DAYS}+ days)
            </span>
          )}
        </div>
        {onBulkAssign && (
          <Button
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={() => onBulkAssign(selectedIds)}
          >
            Assign {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}selected
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                <th className="px-4 py-2.5 w-8">
                  {onBulkAssign && (
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  )}
                </th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
                <th className="px-4 py-2.5 font-medium">Plans</th>
                <th className="px-4 py-2.5 font-medium">First purchase</th>
                <th className="px-4 py-2.5 font-medium">Waiting</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No unassigned customers — everyone has a CS Manager.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const overdue = c.daysUnassigned >= OVERDUE_THRESHOLD_DAYS;
                  return (
                    <tr key={c._id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        {onBulkAssign && (
                          <Checkbox
                            checked={!!selected[c._id]}
                            onCheckedChange={() => toggleOne(c._id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold">
                            {initialsOf(c)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">
                              {fullName(c)}
                            </p>
                            <p className="text-xs text-gray-500 leading-tight">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {c.phone ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">
                        {c.planCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {timeAgo(c.firstPurchaseAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                            overdue
                              ? "bg-red-50 text-[#AD1F2A]"
                              : "bg-amber-50 text-amber-700"
                          )}
                        >
                          {c.daysUnassigned}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {onAssignOne && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAssignOne(c)}
                          >
                            Assign
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

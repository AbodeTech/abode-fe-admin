"use client";

import Link from "next/link";
import { ArrowRight, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CSManagerSummary } from "../types";

interface Props {
  managers: CSManagerSummary[];
  onRemove?: (manager: CSManagerSummary) => void;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const initialsOf = (m: CSManagerSummary["manager"]) =>
  ((m.lastName?.[0] ?? "") + (m.firstName?.[0] ?? "")).toUpperCase() ||
  m.email[0].toUpperCase();

const fullName = (m: CSManagerSummary["manager"]) =>
  `${m.lastName ?? ""} ${m.firstName ?? ""}`.trim() || m.email;

const scoreClass = (score: number | null) => {
  if (score === null) return "bg-gray-100 text-gray-500";
  if (score >= 85) return "bg-[#E0F2F1] text-[#00695C]";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-[#AD1F2A]";
};

export function CSManagersListTable({ managers, onRemove }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
              <th className="px-4 py-2.5 font-medium">CS Manager</th>
              <th className="px-4 py-2.5 font-medium">Customers</th>
              <th className="px-4 py-2.5 font-medium">Active plans</th>
              <th className="px-4 py-2.5 font-medium">This period score</th>
              <th className="px-4 py-2.5 font-medium">Active since</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {managers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No CS Managers yet. Promote an admin to get started.
                </td>
              </tr>
            ) : (
              managers.map((m) => (
                <tr key={m._id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customer-managers/${m.manager._id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold">
                        {initialsOf(m.manager)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 leading-tight group-hover:text-[#00695C]">
                          {fullName(m.manager)}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight">
                          {m.manager.email}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">
                    {m.assignedCustomersCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">
                    {m.assignedPlansCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                        scoreClass(m.currentPeriodScore)
                      )}
                    >
                      {m.currentPeriodScore === null
                        ? "No score yet"
                        : `${m.currentPeriodScore.toFixed(1)} / 100`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(m.activeSince)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/customer-managers/${m.manager._id}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C] border border-gray-200 rounded-md px-2 py-1"
                      >
                        View
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      {onRemove && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-[#AD1F2A] focus:text-[#AD1F2A]"
                              onSelect={() => onRemove(m)}
                            >
                              Remove CS Manager role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

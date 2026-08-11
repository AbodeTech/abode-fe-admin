"use client";

import { Badge } from "@/components/ui/badge";

import type { FlexLeadStatus } from "../hooks/types";

const STYLES: Record<FlexLeadStatus, { label: string; className: string }> = {
  new: {
    label: "New",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  contacted: {
    label: "Contacted",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-violet-100 text-violet-800 hover:bg-violet-100",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
};

export function FlexLeadStatusBadge({ status }: { status: FlexLeadStatus }) {
  const style = STYLES[status];
  return (
    <Badge variant="secondary" className={style.className}>
      {style.label}
    </Badge>
  );
}

export const FLEX_LEAD_STATUS_OPTIONS: { label: string; value: FlexLeadStatus }[] =
  [
    { label: "New", value: "new" },
    { label: "Contacted", value: "contacted" },
    { label: "Scheduled", value: "scheduled" },
    { label: "Completed", value: "completed" },
    { label: "Closed", value: "closed" },
  ];

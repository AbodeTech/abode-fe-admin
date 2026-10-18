"use client";

import { Badge } from "@/components/ui/badge";

import {
  FLEX_LEAD_STATUSES,
  FLEX_LEAD_STATUS_LABELS,
  type FlexLeadStatus,
} from "../schemas/flex-lead.schema";

const STYLES: Record<FlexLeadStatus, string> = {
  new: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  contacted: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  scheduled: "bg-violet-100 text-violet-800 hover:bg-violet-100",
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
  closed: "bg-slate-100 text-slate-700 hover:bg-slate-100",
};

export function FlexLeadStatusBadge({ status }: { status: FlexLeadStatus }) {
  return (
    <Badge variant="secondary" className={STYLES[status]}>
      {FLEX_LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}

export const FLEX_LEAD_STATUS_OPTIONS = FLEX_LEAD_STATUSES.map((value) => ({
  value,
  label: FLEX_LEAD_STATUS_LABELS[value],
}));

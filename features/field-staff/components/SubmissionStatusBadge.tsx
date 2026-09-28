"use client";

import { cn } from "@/lib/utils";

import type { SubmissionStatus } from "../schemas/submission.schema";

const STYLES: Record<SubmissionStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  submitted: { label: "Awaiting review", className: "bg-amber-50 text-amber-700" },
  verified: { label: "Verified", className: "bg-[#E0F2F1] text-[#00695C]" },
  rejected: { label: "Rejected", className: "bg-red-50 text-[#AD1F2A]" },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground" },
  corrected: { label: "Corrected", className: "bg-blue-50 text-blue-700" },
  reversed: { label: "Reversed", className: "bg-muted text-muted-foreground" },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const style = STYLES[status];
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", style.className)}>
      {style.label}
    </span>
  );
}

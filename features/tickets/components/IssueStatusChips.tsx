"use client";

import { cn } from "@/lib/utils";
import { IssueStatus } from "@/lib/gql/graphql";
import { ISSUE_STATUS_LABELS } from "../lib/ticket-display";

interface Props {
  active: IssueStatus | null;
  onChange: (value: IssueStatus | null) => void;
}

const CHIPS: { key: IssueStatus | null; label: string }[] = [
  { key: null, label: "All" },
  { key: IssueStatus.Investigating, label: ISSUE_STATUS_LABELS.investigating },
  { key: IssueStatus.Identified, label: ISSUE_STATUS_LABELS.identified },
  { key: IssueStatus.Monitoring, label: ISSUE_STATUS_LABELS.monitoring },
  { key: IssueStatus.Resolved, label: ISSUE_STATUS_LABELS.resolved },
];

export function IssueStatusChips({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CHIPS.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={String(c.key)}
            type="button"
            onClick={() => onChange(c.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs border transition-colors",
              isActive
                ? "bg-[#00695C] text-white border-[#00695C]"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

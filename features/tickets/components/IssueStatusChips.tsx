"use client";

import { cn } from "@/lib/utils";
import { ISSUE_STATUS_LABELS } from "../lib/ticket-display";
import { type IssueStatus } from "../schemas/ticket.schema";

interface Props {
  active: IssueStatus | null;
  onChange: (value: IssueStatus | null) => void;
}

const CHIPS: { key: IssueStatus | null; label: string }[] = [
  { key: null, label: "All" },
  { key: 'investigating', label: ISSUE_STATUS_LABELS.investigating },
  { key: 'identified', label: ISSUE_STATUS_LABELS.identified },
  { key: 'monitoring', label: ISSUE_STATUS_LABELS.monitoring },
  { key: 'resolved', label: ISSUE_STATUS_LABELS.resolved },
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

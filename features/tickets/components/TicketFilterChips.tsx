"use client";

import { cn } from "@/lib/utils";
import { TicketFilter, type GetTicketsQuery } from "@/lib/gql/graphql";
import { FILTER_LABELS } from "../lib/ticket-display";

interface Props {
  active: TicketFilter;
  onChange: (value: TicketFilter) => void;
  counts?: GetTicketsQuery["getTickets"]["filterCounts"];
}

/** Book-wide filter chips. Counts stay stable regardless of the
 * active chip — that's the BE contract (see filterCounts). */
export function TicketFilterChips({ active, onChange, counts }: Props) {
  const chips: {
    key: TicketFilter;
    count: number | undefined;
    tone: "neutral" | "warn" | "critical";
  }[] = [
    { key: TicketFilter.All, count: counts?.all, tone: "neutral" },
    { key: TicketFilter.Unassigned, count: counts?.unassigned, tone: "warn" },
    { key: TicketFilter.Unlinked, count: counts?.unlinked, tone: "warn" },
    { key: TicketFilter.Open, count: counts?.open, tone: "neutral" },
    {
      key: TicketFilter.WaitingCustomer,
      count: counts?.waitingCustomer,
      tone: "neutral",
    },
    {
      key: TicketFilter.BlockedOnIssue,
      count: counts?.blockedOnIssue,
      tone: "critical",
    },
    { key: TicketFilter.Resolved, count: counts?.resolved, tone: "neutral" },
  ];

  const toneCountClass = (tone: "neutral" | "warn" | "critical") => {
    switch (tone) {
      case "warn":
        return "text-amber-700";
      case "critical":
        return "text-[#AD1F2A]";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors",
              isActive
                ? "bg-[#00695C] text-white border-[#00695C]"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            )}
          >
            {FILTER_LABELS[c.key]}
            <span
              className={cn(
                "tabular-nums text-[11px]",
                isActive ? "text-white/90" : toneCountClass(c.tone)
              )}
            >
              {c.count ?? "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

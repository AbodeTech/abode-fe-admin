"use client";

import { cn } from "@/lib/utils";
import { TicketFilter, type GetTicketsQuery } from "@/lib/gql/graphql";
import { FILTER_LABELS } from "../lib/ticket-display";

interface Props {
  active: TicketFilter;
  onChange: (value: TicketFilter) => void;
  counts?: GetTicketsQuery["getTickets"]["filterCounts"];
  /**
   * Whether the reader also sees the unassigned pool — the router.
   *
   * For everyone else the list is already scoped to their own work, so "All"
   * and "Mine" are the same list and "Unassigned"/"Unlinked" can only ever read
   * zero. Dropping those three is presentation only; the scope itself is
   * enforced server-side, so this is not what stops anyone seeing anything.
   */
  canRoute?: boolean;
}

/** Book-wide filter chips. Counts stay stable regardless of the
 * active chip — that's the BE contract (see filterCounts). */
export function TicketFilterChips({
  active,
  onChange,
  counts,
  canRoute = false,
}: Props) {
  type Chip = {
    key: TicketFilter;
    count: number | undefined;
    tone: "neutral" | "warn" | "critical";
  };

  const chips: Chip[] = ([
    { key: TicketFilter.All, count: counts?.all, tone: "neutral" },
    // Resolved server-side from the auth context: owned by me, OR I was pulled
    // in as a collaborator. Without it a specialist has no queue of their own.
    { key: TicketFilter.Mine, count: counts?.mine, tone: "neutral" },
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
  ] as Chip[]).filter(
    (c) =>
      canRoute ||
      ![TicketFilter.Mine, TicketFilter.Unassigned, TicketFilter.Unlinked].includes(
        c.key
      )
  );

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

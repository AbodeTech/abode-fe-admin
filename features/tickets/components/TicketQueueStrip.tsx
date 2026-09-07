"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hourglass,
  Inbox,
  Link2,
  Loader2,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTicketQueueStats } from "../hooks/use-tickets";

/**
 * The queue in seven numbers.
 *
 * Scoped by the BE to whatever the reader can actually open — their own work,
 * or the whole book if they hold the CS Manager role. A strip that counted
 * tickets the reader cannot reach would read as work they are failing to do
 * and cannot act on, which is worse than showing nothing.
 *
 * Only two of these change behaviour: `breaching` and `oldestOpenHours`. They
 * are the ones that go red. The rest are shape — they explain what the queue is
 * made of, so the two that matter can be read against something.
 */

const formatAge = (hours?: number | null) => {
  if (hours === null || hours === undefined) return "—";
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
};

interface TileProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  /** Draws attention only when the number is one somebody has to act on. */
  alarming?: boolean;
}

function Tile({ label, value, icon: Icon, alarming }: TileProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border px-3 py-2.5",
        alarming
          ? "border-red-200 bg-red-50/60"
          : "border-gray-200 bg-white"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          alarming ? "text-[#AD1F2A]" : "text-gray-400"
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            "text-lg font-semibold leading-none tabular-nums",
            alarming ? "text-[#AD1F2A]" : "text-gray-900"
          )}
        >
          {value}
        </p>
        <p className="mt-1 truncate text-[11px] leading-none text-gray-500">
          {label}
        </p>
      </div>
    </div>
  );
}

export function TicketQueueStrip() {
  const { data, isLoading, isError } = useTicketQueueStats();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the queue…
      </div>
    );
  }

  // The table below still works without these, so a failure here is reported
  // quietly rather than taking the page down with it.
  if (isError || !data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-[11px] text-gray-500">
        Queue numbers are unavailable right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      <Tile label="Open" value={data.open} icon={Inbox} />
      <Tile label="In progress" value={data.inProgress} icon={Hourglass} />
      <Tile
        label="Waiting on customer"
        value={data.waitingCustomer}
        icon={UserRound}
      />
      <Tile
        label="Blocked on an issue"
        value={data.blockedOnIssue}
        icon={Link2}
        alarming={data.blockedOnIssue > 0}
      />
      <Tile
        label="Waiting over 48h"
        value={data.breaching}
        icon={AlertTriangle}
        alarming={data.breaching > 0}
      />
      <Tile
        label="Oldest still open"
        value={formatAge(data.oldestOpenHours)}
        icon={Clock}
        alarming={(data.oldestOpenHours ?? 0) > 48}
      />
      <Tile
        label="Resolved this week"
        value={data.resolvedLast7Days}
        icon={CheckCircle2}
      />
    </div>
  );
}

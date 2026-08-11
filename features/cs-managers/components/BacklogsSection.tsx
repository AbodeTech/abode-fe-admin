"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CsManagerBacklogs as CSManagerBacklogs } from "@/lib/gql/graphql";

interface Props {
  backlogs: CSManagerBacklogs;
  onOpenAllocationQueue?: () => void;
  onOpenPurchaseConfirmations?: () => void;
  onOpenDoaQueue?: () => void;
}

/**
 * Backlog cards — work that carried over from prior periods (or missed
 * this period's cutoff). Never counts against the current period's
 * target; own workload to burn down.
 */
export function BacklogsSection({
  backlogs,
  onOpenAllocationQueue,
  onOpenPurchaseConfirmations,
  onOpenDoaQueue,
}: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">
          Workload Backlogs
        </h2>
        <span className="text-xs text-gray-500">
          Separate from the period target — work to burn down.
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BacklogCard
          total={backlogs.allocation.total}
          label="Due for Allocation"
          pillLabel="Overdue"
          rows={[
            { label: "This month", value: backlogs.allocation.thisMonth, tone: "fresh" },
            { label: "Last month", value: backlogs.allocation.lastMonth, tone: "warn" },
            { label: "Older", value: backlogs.allocation.older, tone: "crit" },
          ]}
          onOpen={onOpenAllocationQueue}
          cta="Review queue"
        />
        <BacklogCard
          total={backlogs.onboarding.total}
          label="Onboarding Pipeline"
          pillLabel="Chase"
          rows={[
            { label: "New purchases · call pending", value: backlogs.onboarding.callPending, tone: "fresh" },
            { label: "Called · confirmation pending", value: backlogs.onboarding.confirmPending, tone: "warn" },
            { label: "Disputed by buyer", value: backlogs.onboarding.disputed, tone: "crit" },
          ]}
          onOpen={onOpenPurchaseConfirmations}
          cta="Open purchase confirmations"
        />
        <BacklogCard
          total={backlogs.doa.total}
          label="Due for Deed of Assignment"
          pillLabel="Overdue"
          rows={[
            { label: "Eligible this month", value: backlogs.doa.thisMonth, tone: "fresh" },
            { label: "Eligible last month", value: backlogs.doa.lastMonth, tone: "warn" },
            { label: "Older", value: backlogs.doa.older, tone: "crit" },
          ]}
          onOpen={onOpenDoaQueue}
          cta="Review queue"
        />
      </div>
    </section>
  );
}

interface BacklogRow {
  label: string;
  value: number;
  tone: "fresh" | "warn" | "crit";
}

const SWATCH_CLASSES: Record<BacklogRow["tone"], string> = {
  fresh: "bg-[#00695C]",
  warn: "bg-amber-500",
  crit: "bg-[#AD1F2A]",
};

function BacklogCard({
  total,
  label,
  pillLabel,
  rows,
  onOpen,
  cta,
}: {
  total: number;
  label: string;
  pillLabel: string;
  rows: BacklogRow[];
  onOpen?: () => void;
  cta: string;
}) {
  const nothing = total === 0;
  return (
    <div
      className={cn(
        "rounded-xl border p-4 bg-white",
        nothing ? "border-gray-200" : "border-amber-300"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
        {!nothing && (
          <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
            {pillLabel}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-gray-500">
              <span
                className={cn("h-2 w-2 rounded-sm", SWATCH_CLASSES[r.tone])}
              />
              {r.label}
            </span>
            <span className="font-semibold text-gray-700 tabular-nums">
              {r.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {onOpen && !nothing && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#00695C] hover:text-[#004D40]"
        >
          {cta}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

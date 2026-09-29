import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ApprovalQueue } from "../schemas/financial-officer.schema";

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

/**
 * What is waiting right now in the shared approval queue, bucketed by weekday
 * hours waited. Live — the period filter doesn't move it.
 */
export function ApprovalQueueCard({ queue }: { queue: ApprovalQueue }) {
  const segments = [
    { label: "Under 12 h", value: queue.under_12h, color: "bg-[#00695C]" },
    { label: "12–24 h", value: queue.between_12_24h, color: "bg-amber-500" },
    { label: "Over 24 h", value: queue.over_24h, color: "bg-[#AD1F2A]" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Waiting now</p>
        <span className="text-2xl font-bold tabular-nums">{queue.total}</span>
      </div>

      {queue.total === 0 ? (
        <p className="text-xs text-gray-500">The approval queue is empty.</p>
      ) : (
        <>
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-gray-100">
            {segments.map((s) =>
              s.value > 0 ? (
                <div key={s.label} className={s.color} style={{ width: `${pct(s.value, queue.total)}%` }} />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            {segments.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-sm ${s.color}`} />
                {s.label} · <span className="tabular-nums">{s.value}</span>
              </span>
            ))}
          </div>
        </>
      )}

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-gray-700">Asset payments</span>
          <span className="text-xs text-gray-500 tabular-nums">
            {queue.asset.waiting} waiting · {queue.asset.over_24h} over 24 h
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-700">Associate Pro upgrades</span>
          <span className="text-xs text-gray-500 tabular-nums">
            {queue.associate_pro.waiting} waiting · {queue.associate_pro.over_24h} over 24 h
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs font-medium">
        <Link href="/transactions/assets" className="inline-flex items-center gap-1 text-[#00695C] hover:underline">
          Asset queue <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/associate-upgrade" className="inline-flex items-center gap-1 text-[#00695C] hover:underline">
          Upgrade queue <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

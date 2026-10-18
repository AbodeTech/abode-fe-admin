import { cn } from "@/lib/utils";
import { formatDayTime, formatHours, formatNaira, formatShortDate } from "../lib/format";
import type { ApprovalStats, FinancialOfficerDashboard } from "../schemas/financial-officer.schema";
import { ApprovalQueueCard } from "./ApprovalQueueCard";

interface Props {
  approvals: FinancialOfficerDashboard["approvals"];
  queue: FinancialOfficerDashboard["queue"];
  decisions: FinancialOfficerDashboard["recent_decisions"];
  targetHours: number;
  /** "Tolu's recent decisions" / "Your recent decisions". */
  decisionsTitle: string;
}

function StatsCard({ title, note, stats }: { title: string; note: string; stats: ApprovalStats }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-500">Decided</p>
          <p className="text-xl font-bold tabular-nums">{stats.decided}</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {stats.approved} approved · {stats.declined} declined
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Average</p>
          <p className="text-xl font-bold tabular-nums">{formatHours(stats.avg_hours)}</p>
          <p className="text-xs text-gray-500 tabular-nums">median {formatHours(stats.median_hours)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Slowest</p>
          <p className="text-xl font-bold tabular-nums">{formatHours(stats.slowest?.hours ?? null)}</p>
          <p className="text-xs text-gray-500 truncate">
            {stats.slowest
              ? `${stats.slowest.customer_name}, ${formatShortDate(stats.slowest.submitted_at)}`
              : "—"}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500">{note}</p>
    </div>
  );
}

export function ApprovalsSection({ approvals, queue, decisions, targetHours, decisionsTitle }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">Payment approvals</h2>
        <span className="text-xs text-gray-500">
          Bank-transfer payments only. The clock pauses Saturday and Sunday (WAT).
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Asset payments"
          stats={approvals.asset}
          note="Flex, full ownership and commercial, every installment type."
        />
        <StatsCard
          title="Associate Pro upgrades"
          stats={approvals.associate_pro}
          note="Upgrade payments made by bank transfer."
        />
        <ApprovalQueueCard queue={queue} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <p className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-200">
          {decisionsTitle}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Submitted</th>
                <th className="px-4 py-2.5 font-medium">Decided</th>
                <th className="px-4 py-2.5 font-medium">Time counted</th>
                <th className="px-4 py-2.5 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No decisions this period.
                  </td>
                </tr>
              ) : (
                decisions.map((d) => {
                  // Explain why the counted time is shorter than the wall clock.
                  const submittedOnWeekend = [0, 6].includes(new Date(d.submitted_at).getDay());
                  const wallHours =
                    (new Date(d.decided_at).getTime() - new Date(d.submitted_at).getTime()) / 3_600_000;
                  const clockNote = submittedOnWeekend
                    ? "clock started Monday"
                    : wallHours - d.hours_counted >= 24
                      ? "weekend not counted"
                      : null;
                  return (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-700">
                        {d.kind === "asset" ? "Asset" : "Associate Pro"} · {d.label}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{d.customer_name}</td>
                      <td className="px-4 py-3 tabular-nums">{formatNaira(d.amount)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDayTime(d.submitted_at)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDayTime(d.decided_at)}</td>
                      <td className="px-4 py-3">
                        <p
                          className={cn(
                            "tabular-nums",
                            d.hours_counted > targetHours && "text-[#AD1F2A] font-medium"
                          )}
                        >
                          {formatHours(d.hours_counted)}
                        </p>
                        {clockNote && <p className="text-[11px] text-gray-500">{clockNote}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            d.outcome === "approved"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-red-50 text-[#AD1F2A]"
                          )}
                        >
                          {d.outcome === "approved" ? "Approved" : "Declined"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

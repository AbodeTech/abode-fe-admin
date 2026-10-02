"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Banknote, Building2, FolderOpen, TriangleAlert } from "lucide-react";
import { KpiTile } from "@/components/shared/KpiTile";
import { cn } from "@/lib/utils";
import { formatHours, formatNairaCompact, formatShortDate } from "../lib/format";
import {
  adminMinName,
  type FinancialOfficersTeamDashboard,
} from "../schemas/financial-officer.schema";
import { ApprovalQueueCard } from "./ApprovalQueueCard";
import { ApprovalTimeTile } from "./ApprovalTimeTile";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const scoreTone = (score: number) =>
  score >= 85 ? "bg-[#E0F2F1] text-[#00695C]" : score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-[#AD1F2A]";

/** Super-admin landing: every officer side by side. */
export function TeamOverview({ team }: { team: FinancialOfficersTeamDashboard }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = team.approval_target_hours;
  const periodLabel = `${MONTHS[team.period.month - 1]} ${team.period.year}`;
  const recoveryPct = team.recovery.target > 0 ? (team.recovery.recovered / team.recovery.target) * 100 : undefined;

  // Sorted best-first so the league table reads as one.
  const officers = [...team.officers].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const openOfficer = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("officer", id);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const hoursCell = (h: number | null) => (
    <span className={cn("tabular-nums", h != null && h > target && "text-[#AD1F2A] font-medium")}>
      {formatHours(h)}
    </span>
  );

  return (
    <div className="space-y-6">
      {team.unassigned_eligible > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            {team.unassigned_eligible} plan{team.unassigned_eligible === 1 ? " qualifies" : "s qualify"} for a recovery
            book but no officer is available to take {team.unassigned_eligible === 1 ? "it" : "them"}.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ApprovalTimeTile
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Avg approval time · Asset"
          avgHours={team.approvals.asset.avg_hours}
          footer={`${team.approvals.asset.decided} decided · weekdays only`}
          targetHours={target}
          tooltip="Every bank-transfer asset payment decided this period, officers and other admins together. Weekends don't count."
        />
        <ApprovalTimeTile
          icon={BadgeCheck}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Avg approval time · Associate Pro"
          avgHours={team.approvals.associate_pro.avg_hours}
          footer={`${team.approvals.associate_pro.decided} decided · weekdays only`}
          targetHours={target}
          tooltip="Every Associate Pro upgrade paid by transfer and decided this period. Weekends don't count."
        />
        <KpiTile
          icon={Banknote}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
          label="Debt recovered"
          actualDisplay={formatNairaCompact(team.recovery.recovered)}
          targetDisplay={team.recovery.target > 0 ? formatNairaCompact(team.recovery.target) : undefined}
          percent={recoveryPct}
          tooltip="Sum across officers. The target is the sum of their individual targets."
        />
        {/* A count with no target — KpiTile would read it as "No benchmark set". */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 inline-flex rounded-lg bg-purple-50 p-2.5">
            <FolderOpen className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-2">Plans in recovery books</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums mb-3">{team.recovery.in_book.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            {formatNairaCompact(team.recovery.outstanding)} outstanding · new plans go to the officer with the
            fewest open
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Officers · {periodLabel}</h2>
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                <th className="px-4 py-2.5 font-medium">Officer</th>
                <th className="px-4 py-2.5 font-medium text-right">In book</th>
                <th className="px-4 py-2.5 font-medium text-right">Suspend ≤14 days</th>
                <th className="px-4 py-2.5 font-medium">Recovered / target</th>
                <th className="px-4 py-2.5 font-medium text-right">Avg · Asset</th>
                <th className="px-4 py-2.5 font-medium text-right">Avg · Pro</th>
                <th className="px-4 py-2.5 font-medium text-right">Decisions</th>
                <th className="px-4 py-2.5 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No officers yet.
                  </td>
                </tr>
              ) : (
                officers.map((o) => {
                  const pct = o.recovery_target > 0 ? Math.min(100, (o.recovered / o.recovery_target) * 100) : 0;
                  return (
                    <tr key={o.officer?.id ?? adminMinName(o.officer)} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        {o.officer ? (
                          <button
                            type="button"
                            onClick={() => openOfficer(o.officer!.id)}
                            className="font-medium text-gray-900 hover:text-[#00695C] hover:underline text-left"
                          >
                            {adminMinName(o.officer)}
                          </button>
                        ) : (
                          <span className="font-medium text-gray-900">Unknown</span>
                        )}
                        {o.role_ended_at && (
                          <p className="text-[11px] text-gray-500">Removed {formatShortDate(o.role_ended_at)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{o.in_book}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right tabular-nums",
                          o.suspending_within_14_days > 0 && "text-[#AD1F2A] font-medium"
                        )}
                      >
                        {o.suspending_within_14_days}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="tabular-nums whitespace-nowrap">
                            {formatNairaCompact(o.recovered)}
                            <span className="text-gray-400">
                              {" "}
                              / {o.recovery_target > 0 ? formatNairaCompact(o.recovery_target) : "no target"}
                            </span>
                          </span>
                          {o.recovery_target > 0 && (
                            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                              <span
                                className={cn(
                                  "block h-full",
                                  pct >= 85 ? "bg-[#00695C]" : pct >= 50 ? "bg-amber-500" : "bg-[#AD1F2A]"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{hoursCell(o.asset_avg_hours)}</td>
                      <td className="px-4 py-3 text-right">{hoursCell(o.pro_avg_hours)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{o.decisions}</td>
                      <td className="px-4 py-3 text-right">
                        {o.score == null ? (
                          <span className="text-xs text-gray-400">no target</span>
                        ) : (
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums", scoreTone(o.score))}>
                            {o.score.toFixed(1)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
              {team.other_admins.decisions > 0 && (
                <tr className="border-t border-gray-100 bg-gray-50/60 text-gray-500">
                  <td className="px-4 py-3">
                    Other admins
                    <p className="text-[11px]">approve permission, not officers</p>
                  </td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-right">{hoursCell(team.other_admins.asset_avg_hours)}</td>
                  <td className="px-4 py-3 text-right">{hoursCell(team.other_admins.pro_avg_hours)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{team.other_admins.decisions}</td>
                  <td className="px-4 py-3 text-right">—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ApprovalQueueCard queue={team.queue} />
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2">
          <p className="text-sm font-semibold text-gray-900">Expired without review</p>
          <p className={cn("text-2xl font-bold tabular-nums", team.expired_unreviewed_upgrades > 0 && "text-[#AD1F2A]")}>
            {team.expired_unreviewed_upgrades}
          </p>
          <p className="text-xs text-gray-500">
            Associate Pro upgrades cancelled after sitting 24 h+ with nobody deciding them. They aren&apos;t in
            anyone&apos;s average.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2">
          <p className="text-sm font-semibold text-gray-900">Lost to suspension</p>
          <p className="text-2xl font-bold tabular-nums">
            {team.recovery.suspended} plan{team.recovery.suspended === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-gray-500">
            {formatNairaCompact(team.recovery.unrecovered_on_suspension)} left owing on plans suspended this month
            while in a recovery book.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  ChevronRight,
  Home,
  Phone,
  LifeBuoy,
  Gauge,
  AlertCircle,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/shared/KpiTile";
import { MonthlyFlowChart, flowRatio } from "@/components/shared/MonthlyFlowChart";
import type {
  Admin,
  CsManagerPeriod as CSManagerPeriod,
  CsManagerTargets as CSManagerTargets,
  CsManagerPerformanceScore as CSManagerPerformanceScore,
  CsManagerObligation as CSManagerObligation,
} from "@/lib/gql/graphql";

/** Local narrowing: the snapshot only reads a handful of Admin fields. */
type CSManagerAdmin = Pick<Admin, "_id" | "userName" | "email" | "role">;

interface Props {
  /**
   * Null in the combined "All CS Managers" view — that view deliberately names
   * nobody rather than inventing a synthetic manager.
   */
  manager: CSManagerAdmin | null;
  period: CSManagerPeriod;
  target: CSManagerTargets;
  score: CSManagerPerformanceScore;
  obligation: CSManagerObligation;
  /**
   * The onboarding backlog, for the demand behind the onboarding target: how
   * many customers are waiting for a call, split by whether they bought this
   * period or earlier. Optional so the tile degrades to its old form against a
   * server that does not send the split yet.
   */
  onboardingBacklog?: { dueThisPeriod?: number | null; dueCarriedOver?: number | null } | null;
  totalAssigned: number;
  onManageTargets?: () => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatPeriod = (period: CSManagerPeriod) => {
  if (period.periodType === "MONTH" && period.month && period.year) {
    return `${MONTHS[period.month - 1]} ${period.year}`;
  }
  if (period.periodType === "YEAR" && period.year) return `${period.year}`;
  if (period.periodType === "WEEK") return "Last 7 days";
  const s = new Date(period.start);
  const e = new Date(period.end);
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
};

const daysRemaining = (end: string) => {
  const d = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(d / (1000 * 60 * 60 * 24)));
};

const hasActiveTarget = (t: CSManagerTargets) =>
  t.allocatedTarget > 0 ||
  t.onboardedTarget > 0 ||
  t.ticketsResolvedTarget > 0;

// BE ships only `userName` on the base Admin type. Split on whitespace as
// a best-effort surname/first-name split, then take the first letters.
// Drop this once BE exposes firstName/lastName on Admin (or points the
// dashboard's manager field at ManagerAdminInfo — same issue as FLEX).
const initialsOf = (m: CSManagerAdmin) => {
  const source = m.userName || m.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "?";
};

const fullName = (m: CSManagerAdmin) => m.userName || m.email;

/** The combined view has no one manager to name. */
const ALL_MANAGERS_LABEL = "All CS Managers";

export function CSManagerSnapshot({
  manager,
  period,
  target,
  score,
  obligation,
  onboardingBacklog,
  totalAssigned,
  onManageTargets,
}: Props) {
  const dueThisMonth = onboardingBacklog?.dueThisPeriod ?? 0;
  const dueCarriedOver = onboardingBacklog?.dueCarriedOver ?? 0;
  // Six months of intake against clearance for this manager, straight off the
  // same target block the rate comes from.
  const [flowOpen, setFlowOpen] = useState(false);
  const flow = target.ticketFlow ?? [];
  const flowTotals = flowRatio(flow);

  const active = hasActiveTarget(target);
  const periodLabel = formatPeriod(period);
  const remaining = daysRemaining(period.end);

  const allocatedPct =
    target.allocatedTarget > 0
      ? (target.allocatedSoFar / target.allocatedTarget) * 100
      : undefined;
  const onboardedPct =
    target.onboardedTarget > 0
      ? (target.onboardedSoFar / target.onboardedTarget) * 100
      : undefined;
  // Both sides are percentages, so attainment is the achieved rate against the
  // required one — not a count against a count like the two tiles above it.
  // Undefined rather than 0 when nothing arrived, so the bar reads "no data"
  // instead of "failed".
  const ticketsPct =
    target.ticketsResolvedTarget > 0 && target.ticketResolutionRate != null
      ? (target.ticketResolutionRate / target.ticketsResolvedTarget) * 100
      : undefined;

  const scoreLine = (
    label: string,
    weight: number,
    componentScore: number,
    hasT: boolean
  ) =>
    hasT
      ? `${label}: ${componentScore.toFixed(1)}/${weight}`
      : `${label}: no target set`;
  const scoreTooltip = [
    `Objective score out of 100. Allocated 40 + Onboarded 30 + Tickets 30.`,
    scoreLine("Allocated", 40, score.allocatedComponent, target.allocatedTarget > 0),
    scoreLine("Onboarded", 30, score.onboardedComponent, target.onboardedTarget > 0),
    scoreLine(
      "Tickets",
      30,
      score.ticketsComponent,
      target.ticketsResolvedTarget > 0
    ),
  ].join(" · ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
          {manager ? initialsOf(manager) : <Users className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {manager ? fullName(manager) : ALL_MANAGERS_LABEL}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {manager
              ? `${manager.email} · ${totalAssigned} customers assigned`
              : `${totalAssigned} customers assigned across every book`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {active ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E0F2F1] text-[#00695C] px-3 py-1.5 text-xs font-medium">
            <Target className="h-3.5 w-3.5" />
            Active target: {periodLabel}
            <span className="text-[#00695C]/70">
              ·{" "}
              {remaining > 0
                ? `${remaining} day${remaining === 1 ? "" : "s"} remaining`
                : "Ends today"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>No active target for this period.</span>
          </div>
        )}

        {/* Targets are per manager — nothing to manage with nobody selected. */}
        {onManageTargets && manager && (
          <Button variant="outline" size="sm" onClick={onManageTargets}>
            <Target className="h-3.5 w-3.5 mr-1.5" />
            Manage targets
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          icon={Home}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Customers Allocated"
          actualDisplay={target.allocatedSoFar.toLocaleString()}
          targetDisplay={
            target.allocatedTarget > 0
              ? target.allocatedTarget.toLocaleString()
              : undefined
          }
          percent={allocatedPct}
          tooltip="Plans allocated a plot this period vs. minimum target. Business rule: every plan that completed its land payment this month must also be allocated this month."
          footer={
            obligation.paidNotAllocatedThisPeriod > 0 ? (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center gap-2 text-xs text-[#AD1F2A]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {obligation.paidNotAllocatedThisPeriod} paid plan
                {obligation.paidNotAllocatedThisPeriod === 1 ? "" : "s"} still
                awaiting a plot this month
              </div>
            ) : null
          }
        />

        <KpiTile
          icon={Phone}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Customers Onboarded"
          actualDisplay={target.onboardedSoFar.toLocaleString()}
          targetDisplay={
            target.onboardedTarget > 0
              ? target.onboardedTarget.toLocaleString()
              : undefined
          }
          percent={onboardedPct}
          tooltip="Onboarding calls logged this period. Every new purchase needs an onboarding call to gather intel on why the customer chose the land."
          // The demand behind the target. A tile that says "12 of 20" answers
          // how much was done against what was asked for, and not the question
          // a CSM actually opens this page with — how many people are waiting
          // for a call, and how many of those are this month's problem.
          footer={
            dueThisMonth + dueCarriedOver > 0 ? (
              <p className="text-xs text-gray-500">
                <span className="font-semibold tabular-nums text-gray-700">
                  {dueThisMonth.toLocaleString()}
                </span>{" "}
                bought this month still need a call
                {dueCarriedOver > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold tabular-nums text-gray-700">
                      {dueCarriedOver.toLocaleString()}
                    </span>{" "}
                    carried over
                  </>
                )}
              </p>
            ) : undefined
          }
        />

        <KpiTile
          icon={LifeBuoy}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
          label="Ticket Resolution Rate"
          actualDisplay={
            target.ticketResolutionRate != null
              ? `${target.ticketResolutionRate}%`
              : "—"
          }
          targetDisplay={
            target.ticketsResolvedTarget > 0
              ? `${target.ticketsResolvedTarget}%`
              : undefined
          }
          percent={ticketsPct}
          // A rate, not a count: how much of the month's intake got dealt with.
          // The raw counts go in the tooltip because the rate is the thing being
          // judged and the counts are how you check it.
          noData={target.ticketsEntered === 0}
          noDataLabel="No tickets came in"
          tooltip={`Of the tickets assigned to this manager that were raised this period, how many are now resolved — ${target.ticketsResolved} of ${target.ticketsEntered}. Measured as of now, not month-end, so a ticket raised on the 30th still counts once it closes.`}
          // The two counts the rate is made of, on the tile rather than hidden
          // in the tooltip: 60% of five tickets and 60% of two hundred are the
          // same percentage and not the same month, and nobody hovers a number
          // they have no reason to doubt yet.
          footer={
            target.ticketsEntered > 0 ? (
              <p className="text-xs text-gray-500">
                <span className="font-semibold tabular-nums text-gray-700">
                  {target.ticketsResolved.toLocaleString()}
                </span>{" "}
                resolved of{" "}
                <span className="font-semibold tabular-nums text-gray-700">
                  {target.ticketsEntered.toLocaleString()}
                </span>{" "}
                that came in
              </p>
            ) : undefined
          }
        />

        <KpiTile
          icon={Gauge}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          label="Performance Score"
          actualDisplay={score.score.toFixed(1)}
          targetDisplay="100"
          percent={score.score}
          tooltip={scoreTooltip}
        />
      </div>

      {/* Under the rate, and for the same reason the counts are on the tile:
          one month's percentage is not a direction. Six months of the two
          numbers behind it says whether this manager is gaining on their
          intake or losing to it. Same attribution as the tile (assigned_admin),
          so the chart and the percentage cannot disagree. */}
      {flow.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white">
          {/* Folded away, like the inbox's. The performance page is read for
              the tiles; the trend is what somebody opens when a tile prompts
              the question. The headline rides on the toggle either way. */}
          <button
            type="button"
            onClick={() => setFlowOpen((v) => !v)}
            aria-expanded={flowOpen}
            className="flex w-full flex-wrap items-center gap-2 px-5 py-3.5 text-left"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                flowOpen && "rotate-90"
              )}
            />
            <span className="text-sm font-semibold text-gray-900">
              Tickets came in vs resolved
            </span>
            <span className="text-xs text-gray-500">Last six months</span>
            {flowTotals.ratio !== null && (
              <span className="ml-auto text-xs text-gray-600">
                <span className="font-semibold tabular-nums text-gray-900">
                  {flowTotals.totalOut.toLocaleString()}
                </span>{" "}
                resolved of{" "}
                <span className="font-semibold tabular-nums text-gray-900">
                  {flowTotals.totalIn.toLocaleString()}
                </span>{" "}
                ·{" "}
                <span
                  className={
                    flowTotals.ratio >= 1
                      ? "font-semibold text-[#1baf7a]"
                      : "font-semibold text-[#AD1F2A]"
                  }
                >
                  {flowTotals.ratio >= 1 ? "keeping up" : "falling behind"}
                </span>
              </span>
            )}
          </button>

          {flowOpen && (
            <div className="border-t border-gray-100 p-5 pt-4">
              <p className="mb-3 text-xs text-gray-500">
                Counted in the month each happened — a ticket resolved this month
                usually arrived in an earlier one.
              </p>
              <MonthlyFlowChart points={flow} height="h-48" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

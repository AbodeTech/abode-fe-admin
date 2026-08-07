"use client";

import {
  Home,
  Phone,
  FileText,
  Gauge,
  Star,
  AlertCircle,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/shared/KpiTile";
import type {
  CSManagerAdmin,
  CSManagerPeriod,
  CSManagerTarget,
  CSManagerPerformanceScore,
  CSManagerObligation,
} from "../types";

interface Props {
  manager: CSManagerAdmin;
  period: CSManagerPeriod;
  target: CSManagerTarget;
  score: CSManagerPerformanceScore;
  obligation: CSManagerObligation;
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

const hasActiveTarget = (t: CSManagerTarget) =>
  t.allocatedTarget > 0 ||
  t.onboardedTarget > 0 ||
  t.deedsDeliveredTarget > 0 ||
  t.performanceScoreTarget > 0;

const initialsOf = (m: CSManagerAdmin) =>
  ((m.lastName?.[0] ?? "") + (m.firstName?.[0] ?? "")).toUpperCase() ||
  m.email[0].toUpperCase();

const fullName = (m: CSManagerAdmin) =>
  `${m.lastName ?? ""} ${m.firstName ?? ""}`.trim() || m.email;

export function CSManagerSnapshot({
  manager,
  period,
  target,
  score,
  obligation,
  totalAssigned,
  onManageTargets,
}: Props) {
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
  const deedsPct =
    target.deedsDeliveredTarget > 0
      ? (target.deedsDeliveredSoFar / target.deedsDeliveredTarget) * 100
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
    `Objective score out of 100. Allocated 40 + Onboarded 30 + DoA 30.`,
    scoreLine("Allocated", 40, score.allocatedComponent, target.allocatedTarget > 0),
    scoreLine("Onboarded", 30, score.onboardedComponent, target.onboardedTarget > 0),
    scoreLine("DoA", 30, score.deedsComponent, target.deedsDeliveredTarget > 0),
  ].join(" · ");

  const RATING_MAX = 5;
  const peerRatingPct =
    score.actual > 0 ? (score.actual / RATING_MAX) * 100 : undefined;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
          {initialsOf(manager)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fullName(manager)}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {manager.email} · {totalAssigned} customers assigned
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

        {onManageTargets && (
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
          tooltip="Customers allocated a plot this period vs. minimum target. Business rule: every customer who completed payment this month must also be allocated this month."
          footer={
            obligation.paidNotAllocatedThisPeriod > 0 ? (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center gap-2 text-xs text-[#AD1F2A]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {obligation.paidNotAllocatedThisPeriod} paid customer
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
        />

        <KpiTile
          icon={FileText}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
          label="Deeds of Assignment Delivered"
          actualDisplay={target.deedsDeliveredSoFar.toLocaleString()}
          targetDisplay={
            target.deedsDeliveredTarget > 0
              ? target.deedsDeliveredTarget.toLocaleString()
              : undefined
          }
          percent={deedsPct}
          tooltip="Deeds sent to eligible customers this period. Full-ownership: eligible after payment plan + doc plan. Flex: eligible after completing land payment."
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

      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3">
        <div className="p-2 rounded-lg bg-amber-50 shrink-0">
          <Star className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium text-gray-900">Peer Rating</p>
            <span className="text-xs text-gray-400">
              subjective · from customer ratings this period
            </span>
          </div>
          {score.ratingCount === 0 ? (
            <p className="text-xs text-gray-500 mt-0.5">
              No ratings yet this period
            </p>
          ) : (
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-semibold text-gray-900 tabular-nums">
                {score.actual.toFixed(2)}
                <span className="text-xs font-normal text-gray-400">
                  {" "}/ 5.00
                </span>
              </span>
              <span className="text-xs text-gray-500">
                {score.ratingCount} rating
                {score.ratingCount === 1 ? "" : "s"}
              </span>
              {peerRatingPct !== undefined && (
                <span className="text-xs text-gray-400 tabular-nums">
                  · {Math.round(peerRatingPct)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

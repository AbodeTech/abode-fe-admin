"use client";

import {
  UserPlus,
  CircleDollarSign,
  RefreshCcw,
  Gauge,
  Target,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/shared/KpiTile";
import type {
  Admin,
  FlexManagerPeriod,
  FlexManagerTargets,
  FlexManagerPerformanceScore,
} from "@/lib/gql/graphql";

/** Local narrowing: the dashboard only reads a handful of Admin fields. */
type FlexManagerAdmin = Pick<Admin, "_id" | "userName" | "email" | "role">;

interface Props {
  manager: FlexManagerAdmin;
  /** ISO date the current holder took over — driven by `getFlexManager`, so
   * the dashboard hero can show "since Jun 2026" without a second lookup. */
  assignedFrom?: string;
  period: FlexManagerPeriod;
  target: FlexManagerTargets;
  score: FlexManagerPerformanceScore;
  /** Super-admin only — surfaces reassignment + target-setting affordances. */
  onManageTargets?: () => void;
  onReassign?: () => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatPeriod = (period: FlexManagerPeriod) => {
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

const hasActiveTarget = (t: FlexManagerTargets) =>
  t.newCustomersTarget > 0 ||
  t.newSalesValueTarget > 0 ||
  t.recurringTarget > 0;

const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatNairaShort = (n: number): string => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${Math.round(n)}`;
};

// BE ships only `userName` on the base Admin type. Split on whitespace as
// a best-effort surname/first-name split, then take the first letters.
// Falls back to the first two letters of userName, and finally to the
// email initial. Drop this once BE exposes firstName/lastName on Admin.
const initialsOf = (m: FlexManagerAdmin) => {
  const source = m.userName || m.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "?";
};

const displayName = (m: FlexManagerAdmin) => m.userName || m.email;

const formatSince = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export function FlexManagerSnapshot({
  manager,
  assignedFrom,
  period,
  target,
  score,
  onManageTargets,
  onReassign,
}: Props) {
  const active = hasActiveTarget(target);
  const periodLabel = formatPeriod(period);
  const remaining = daysRemaining(period.end);

  const newCustomersPct =
    target.newCustomersTarget > 0
      ? (target.newCustomersSoFar / target.newCustomersTarget) * 100
      : undefined;
  const newSalesPct =
    target.newSalesValueTarget > 0
      ? (target.newSalesValueSoFar / target.newSalesValueTarget) * 100
      : undefined;
  const recurringPct =
    target.recurringTarget > 0
      ? (target.recurringSoFar / target.recurringTarget) * 100
      : undefined;

  // Collections gap — the FM's dunning story. When actual < system-expected,
  // the difference is real money that was scheduled to come in but didn't.
  const collectionGap = Math.max(
    0,
    target.recurringExpected - target.recurringSoFar
  );

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
    `Objective score out of 100. New Customers 50 + New Sales 30 + Recurring 20.`,
    scoreLine(
      "New Customers",
      50,
      score.newCustomersComponent,
      target.newCustomersTarget > 0
    ),
    scoreLine(
      "New Sales",
      30,
      score.newSalesComponent,
      target.newSalesValueTarget > 0
    ),
    scoreLine(
      "Recurring",
      20,
      score.recurringComponent,
      target.recurringTarget > 0
    ),
  ].join(" · ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
          {initialsOf(manager)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">
              {displayName(manager)}
            </p>
            <span className="text-xs text-gray-500">FLEX Manager</span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {manager.email}
            {assignedFrom && ` · assigned since ${formatSince(assignedFrom)}`}
          </p>
        </div>
        {onReassign && (
          <Button variant="ghost" size="sm" onClick={onReassign}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
            Reassign
          </Button>
        )}
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
          icon={UserPlus}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="New Flex Customers"
          actualDisplay={target.newCustomersSoFar.toLocaleString()}
          targetDisplay={
            target.newCustomersTarget > 0
              ? target.newCustomersTarget.toLocaleString()
              : undefined
          }
          percent={newCustomersPct}
          tooltip="Unique users whose first Flex purchase (initial payment) fell in this period. Repeat customers opening a second plan don't count."
        />

        <KpiTile
          icon={CircleDollarSign}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="New Sales Value"
          actualDisplay={formatNairaShort(target.newSalesValueSoFar)}
          targetDisplay={
            target.newSalesValueTarget > 0
              ? formatNairaShort(target.newSalesValueTarget)
              : undefined
          }
          percent={newSalesPct}
          tooltip={`Sum of initial-payment values on Flex this period. Currently ${formatNaira(target.newSalesValueSoFar)}.`}
        />

        <KpiTile
          icon={RefreshCcw}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
          label="Recurring Collected"
          actualDisplay={formatNairaShort(target.recurringSoFar)}
          targetDisplay={
            target.recurringTarget > 0
              ? formatNairaShort(target.recurringTarget)
              : undefined
          }
          percent={recurringPct}
          tooltip={`Sum of recurring payments collected on Flex this period. System expected ${formatNaira(target.recurringExpected)}; you've collected ${formatNaira(target.recurringSoFar)}.`}
          footer={
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>System expected</span>
                <span className="font-medium text-gray-700 tabular-nums">
                  {formatNairaShort(target.recurringExpected)}
                </span>
              </div>
              {collectionGap > 0 ? (
                <div className="flex items-center gap-2 text-xs text-[#AD1F2A]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Collection gap: {formatNairaShort(collectionGap)} short
                </div>
              ) : (
                <div className="text-xs text-emerald-700">
                  Collections tracking above schedule
                </div>
              )}
            </div>
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
    </div>
  );
}

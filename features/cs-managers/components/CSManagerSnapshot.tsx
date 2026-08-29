"use client";

import { Home, Phone, FileText, Gauge, AlertCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/shared/KpiTile";
import { adminMinInitials, adminMinName, type CSManagerDashboard } from "../schemas/cs-manager.schema";

interface Props {
  manager: NonNullable<CSManagerDashboard["manager"]>;
  period: CSManagerDashboard["period"];
  target: CSManagerDashboard["target"];
  score: CSManagerDashboard["performance_score"];
  obligation: CSManagerDashboard["obligation"];
  totalAssigned: number;
  onManageTargets?: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatPeriod = (period: CSManagerDashboard["period"]) =>
  `${MONTHS[period.month - 1]} ${period.year}`;

const daysRemaining = (end: string) => {
  const d = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(d / (1000 * 60 * 60 * 24)));
};

const hasActiveTarget = (t: CSManagerDashboard["target"]) =>
  t.allocated_target > 0 || t.onboarded_target > 0 || t.deeds_delivered_target > 0;

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
    target.allocated_target > 0 ? (target.allocated_so_far / target.allocated_target) * 100 : undefined;
  const onboardedPct =
    target.onboarded_target > 0 ? (target.onboarded_so_far / target.onboarded_target) * 100 : undefined;
  const deedsPct =
    target.deeds_delivered_target > 0
      ? (target.deeds_delivered_so_far / target.deeds_delivered_target) * 100
      : undefined;

  const scoreLine = (label: string, weight: number, componentScore: number, hasT: boolean) =>
    hasT ? `${label}: ${componentScore.toFixed(1)}/${weight}` : `${label}: no target set`;
  const scoreTooltip = [
    `Objective score out of 100. Allocated 40 + Onboarded 30 + DoA 30.`,
    scoreLine("Allocated", 40, score.allocated_component, target.allocated_target > 0),
    scoreLine("Onboarded", 30, score.onboarded_component, target.onboarded_target > 0),
    scoreLine("DoA", 30, score.deeds_component, target.deeds_delivered_target > 0),
  ].join(" · ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
          {adminMinInitials(manager)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{adminMinName(manager)}</p>
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
              · {remaining > 0 ? `${remaining} day${remaining === 1 ? "" : "s"} remaining` : "Ends today"}
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
          actualDisplay={target.allocated_so_far.toLocaleString()}
          targetDisplay={target.allocated_target > 0 ? target.allocated_target.toLocaleString() : undefined}
          percent={allocatedPct}
          tooltip="Plans allocated a plot this period vs. minimum target. Business rule: every plan that completed its land payment this month must also be allocated this month."
          footer={
            obligation.paid_not_allocated_this_period > 0 ? (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center gap-2 text-xs text-[#AD1F2A]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {obligation.paid_not_allocated_this_period} paid plan
                {obligation.paid_not_allocated_this_period === 1 ? "" : "s"} still awaiting a plot this
                month
              </div>
            ) : null
          }
        />

        <KpiTile
          icon={Phone}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Customers Onboarded"
          actualDisplay={target.onboarded_so_far.toLocaleString()}
          targetDisplay={target.onboarded_target > 0 ? target.onboarded_target.toLocaleString() : undefined}
          percent={onboardedPct}
          tooltip="Onboarding calls logged this period. Every new purchase needs an onboarding call to gather intel on why the customer chose the land."
        />

        <KpiTile
          icon={FileText}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
          label="Deeds of Assignment Delivered"
          actualDisplay={target.deeds_delivered_so_far.toLocaleString()}
          targetDisplay={
            target.deeds_delivered_target > 0 ? target.deeds_delivered_target.toLocaleString() : undefined
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
    </div>
  );
}

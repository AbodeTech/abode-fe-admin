"use client";

import { AlertCircle, BadgeCheck, Banknote, Building2, Gauge, HandCoins, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/shared/KpiTile";
import { formatNairaCompact } from "../lib/format";
import {
  adminMinInitials,
  adminMinName,
  type ApprovalStats,
  type FinancialOfficerDashboard,
} from "../schemas/financial-officer.schema";
import { ApprovalTimeTile } from "./ApprovalTimeTile";

interface Props {
  dashboard: FinancialOfficerDashboard & { officer: NonNullable<FinancialOfficerDashboard["officer"]> };
  onManageTargets?: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const countsLine = (s: ApprovalStats) => `${s.decided} decided · ${s.declined} declined`;

const WEEKDAY_NOTE = "Saturday and Sunday (WAT) don't count; a weekend submission starts the clock on Monday.";

export function FOSnapshot({ dashboard, onManageTargets }: Props) {
  const { officer, period, approvals, recovery, performance_score: score, approval_target_hours } = dashboard;
  const periodLabel = `${MONTHS[period.month - 1]} ${period.year}`;
  const hasLandTarget = recovery.land_target > 0;
  const hasDevLevyTarget = recovery.dev_levy_target > 0;

  const scoreTooltip = [
    "Out of 100: asset speed 25 + Associate Pro speed 25 + land recovery 25 + development levy recovery 25.",
    `Speed earns full marks at or under ${approval_target_hours} h.`,
    `Asset ${score.asset_speed_component.toFixed(1)}/25`,
    `Pro ${score.pro_speed_component.toFixed(1)}/25`,
    hasLandTarget ? `Land recovery ${score.land_recovery_component.toFixed(1)}/25` : "Land recovery: no target set",
    hasDevLevyTarget
      ? `Development levy recovery ${score.dev_levy_recovery_component.toFixed(1)}/25`
      : "Development levy recovery: no target set",
  ].join(" · ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm shrink-0">
            {adminMinInitials(officer)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{adminMinName(officer)}</p>
            <p className="text-xs text-gray-500 truncate">
              {officer.email} · {recovery.in_book} plan{recovery.in_book === 1 ? "" : "s"} in book
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {hasLandTarget || hasDevLevyTarget ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E0F2F1] text-[#00695C] px-3 py-1.5 text-xs font-medium">
              <Target className="h-3.5 w-3.5" />
              {periodLabel}: Land {formatNairaCompact(recovery.land_target)} · Levy {formatNairaCompact(recovery.dev_levy_target)}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              No recovery target for {periodLabel}
            </div>
          )}
          {onManageTargets && (
            <Button variant="outline" size="sm" onClick={onManageTargets}>
              <Target className="h-3.5 w-3.5 mr-1.5" />
              Manage targets
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <ApprovalTimeTile
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Avg approval time · Asset"
          avgHours={approvals.asset.avg_hours}
          footer={countsLine(approvals.asset)}
          targetHours={approval_target_hours}
          tooltip={`Submission to approve or decline, on bank-transfer asset payments this officer decided. ${WEEKDAY_NOTE}`}
        />
        <ApprovalTimeTile
          icon={BadgeCheck}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Avg approval time · Associate Pro"
          avgHours={approvals.associate_pro.avg_hours}
          footer={countsLine(approvals.associate_pro)}
          targetHours={approval_target_hours}
          tooltip={`Submission to approve or decline, on Associate Pro upgrade payments made by bank transfer. ${WEEKDAY_NOTE}`}
        />
        <ApprovalTimeTile
          icon={HandCoins}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          label="Avg approval time · Withdrawal"
          avgHours={approvals.withdrawal.avg_hours}
          footer={countsLine(approvals.withdrawal)}
          targetHours={approval_target_hours}
          tooltip={`Submission to approve or decline, on manually reviewed withdrawal requests. ${WEEKDAY_NOTE}`}
        />
        <KpiTile
          icon={Banknote}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
          label="Land debt recovered"
          actualDisplay={formatNairaCompact(recovery.land_recovered)}
          targetDisplay={hasLandTarget ? formatNairaCompact(recovery.land_target) : undefined}
          percent={hasLandTarget ? (recovery.land_recovered / recovery.land_target) * 100 : undefined}
          tooltip="Land payments made this period on plans in this officer's recovery book, up to the day each plan is suspended."
          footer={
            <p className="mt-3 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500">
              {recovery.payments_count} payment{recovery.payments_count === 1 ? "" : "s"} on{" "}
              {recovery.plans_paid_count} plan{recovery.plans_paid_count === 1 ? "" : "s"}
            </p>
          }
        />
        <KpiTile
          icon={Banknote}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
          label="Development levy recovered"
          actualDisplay={formatNairaCompact(recovery.dev_levy_recovered)}
          targetDisplay={hasDevLevyTarget ? formatNairaCompact(recovery.dev_levy_target) : undefined}
          percent={hasDevLevyTarget ? (recovery.dev_levy_recovered / recovery.dev_levy_target) * 100 : undefined}
          tooltip="Development-levy payments made this period on Full Ownership and Commercial plans in this officer's recovery book, up to the day each plan is suspended."
        />
        <KpiTile
          icon={Gauge}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          label="Performance score"
          actualDisplay={score.score.toFixed(1)}
          targetDisplay="100"
          percent={score.score}
          tooltip={scoreTooltip}
        />
      </div>
    </div>
  );
}

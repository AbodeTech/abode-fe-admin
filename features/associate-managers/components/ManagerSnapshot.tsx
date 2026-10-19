"use client";

import { useState } from "react";
import {
  TrendingUp,
  Briefcase,
  Star,
  Gauge,
  CircleDollarSign,
  Info,
  Target,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ManageTargetsDialog } from "./dialogs/ManageTargetsDialog";
import {
  managerDisplayName,
  managerInitials,
  type ManagerListItem,
} from "../schemas/associate-manager.schema";
import type { ManagerDashboard } from "../schemas/manager-dashboard.schema";
import { formatCurrencyShort as formatNairaShort } from "../lib/attribution";

interface Props {
  viewAs: "admin" | "manager";
  /** manage_manager_tracker: set and change a manager's targets. */
  canManageTargets: boolean;
  /** Active manager (from the managers list lookup). Null for manager view. */
  manager: ManagerListItem | null;
  dashboard: ManagerDashboard;
}

const formatNaira = (value: number) => `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

type Tone = "exceeded" | "on-track" | "approaching" | "behind";

const toneFor = (pct: number): Tone => {
  if (pct >= 100) return "exceeded";
  if (pct >= 85) return "on-track";
  if (pct >= 50) return "approaching";
  return "behind";
};

const TONE_STYLES: Record<
  Tone,
  { bar: string; pillBg: string; pillText: string; label: string }
> = {
  exceeded: {
    bar: "bg-[#00695C]",
    pillBg: "bg-[#00695C]",
    pillText: "text-white",
    label: "Exceeded",
  },
  "on-track": {
    bar: "bg-[#00695C]",
    pillBg: "bg-[#E0F2F1]",
    pillText: "text-[#00695C]",
    label: "On track",
  },
  approaching: {
    bar: "bg-amber-500",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
    label: "Approaching",
  },
  behind: {
    bar: "bg-[#AD1F2A]",
    pillBg: "bg-red-50",
    pillText: "text-[#AD1F2A]",
    label: "Below target",
  },
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatPeriod = (period: ManagerDashboard["period"]) => {
  // `resolvePeriod` lowercases whatever it was sent, so the v1 spellings this
  // FE sends come back as "month" / "week" / "year", not "MONTH".
  if (period.period_type.toLowerCase() === "month" && period.month && period.year) {
    return `${MONTHS[period.month - 1]} ${period.year}`;
  }
  if (period.period_type.toLowerCase() === "year" && period.year) {
    return `${period.year}`;
  }
  if (period.period_type.toLowerCase() === "week") {
    return "Last 7 days";
  }
  // CUSTOM
  const s = new Date(period.start);
  const e = new Date(period.end);
  const sStr = `${s.getDate()} ${MONTHS[s.getMonth()]}`;
  const eStr = `${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  return `${sStr} – ${eStr}`;
};

const daysRemaining = (periodEnd: Date | string) => {
  const end = new Date(periodEnd);
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const hasActiveTarget = (target: ManagerDashboard["target"]) =>
  target.recruited_target > 0 ||
  target.selling_target > 0 ||
  target.performance_score_target > 0;

interface KpiTileProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  actualDisplay: string;
  targetDisplay?: string;
  percent?: number;
  tooltip?: string;
  /** When true, replace the value + bar with an empty-state message.
   * Used for "No ratings yet" so 0.00 doesn't read as an actual score. */
  noData?: boolean;
  noDataLabel?: string;
}

function KpiTile({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  actualDisplay,
  targetDisplay,
  percent,
  tooltip,
  noData = false,
  noDataLabel = "No data yet",
}: KpiTileProps) {
  const hasTarget = targetDisplay !== undefined && percent !== undefined;
  const tone = hasTarget ? toneFor(percent) : null;
  const s = tone ? TONE_STYLES[tone] : null;
  const cappedPercent = hasTarget ? Math.min(percent, 100) : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-2">{label}</p>

      {noData ? (
        <>
          <p className="text-2xl font-semibold text-gray-300 mb-3">—</p>
          <p className="text-xs text-gray-500">{noDataLabel}</p>
        </>
      ) : (
        <>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold text-gray-900">
          {actualDisplay}
        </span>
        {hasTarget && (
          <span className="text-sm text-gray-400">/ {targetDisplay}</span>
        )}
      </div>

      {hasTarget && s ? (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 mb-2">
            <div
              className={cn("h-full transition-all", s.bar)}
              style={{ width: `${cappedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                s.pillBg,
                s.pillText
              )}
            >
              {s.label}
            </span>
            <span className="text-xs font-medium text-gray-500 tabular-nums">
              {Math.round(percent)}%
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400 italic">No benchmark set</p>
      )}
        </>
      )}
    </div>
  );
}

function ActiveTargetPill({
  periodLabel,
  remaining,
}: {
  periodLabel: string;
  remaining: number;
}) {
  return (
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
  );
}

function NoActiveTargetBanner({
  viewAs,
  canSetTargets,
  onSet,
}: {
  viewAs: Props["viewAs"];
  canSetTargets: boolean;
  onSet: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          No active target for this period.
          {viewAs === "manager" && " Ask Super Admin to set one."}
        </span>
      </div>
      {canSetTargets && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSet}
          className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
        >
          Set targets →
        </Button>
      )}
    </div>
  );
}

export function ManagerSnapshot({ viewAs, canManageTargets, manager, dashboard }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const target = dashboard.target;
  const period = dashboard.period;
  const score = dashboard.performance_score;
  const active = hasActiveTarget(target);
  const periodLabel = formatPeriod(period);
  const remaining = daysRemaining(period.end);

  const recruitedPct =
    target.recruited_target > 0
      ? (target.recruited_so_far / target.recruited_target) * 100
      : undefined;
  const sellingPct =
    target.selling_target > 0
      ? (target.selling_so_far / target.selling_target) * 100
      : undefined;
  const revenuePct = target.revenue_target > 0
    ? (target.revenue_so_far / target.revenue_target) * 100
    : undefined;
  const RATING_MAX = 5;
  const peerRatingPct = score.actual > 0 ? (score.actual / RATING_MAX) * 100 : undefined;
  const componentLine = (label: string, weight: number, value: number, hasTarget: boolean) =>
    hasTarget ? `${label}: ${value.toFixed(1)}/${weight}` : `${label}: no target set`;
  const scoreTooltip = [
    "Objective score out of 100. Selling 50 + Revenue 30 + Recruitment 20.",
    componentLine("Selling", 50, score.selling_component, target.selling_target > 0),
    componentLine("Revenue", 30, score.revenue_component, target.revenue_target > 0),
    componentLine("Recruitment", 20, score.recruitment_component, target.recruited_target > 0),
  ].join(" · ");

  const managerAdminId = manager?.manager_id ?? null;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        {viewAs === "admin" && manager && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
              {managerInitials(manager)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {managerDisplayName(manager)}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {manager.roster_size} Pros assigned
              </p>
            </div>
          </div>
        )}

        {/* Active target row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {active ? (
            <ActiveTargetPill periodLabel={periodLabel} remaining={remaining} />
          ) : (
            <div className="flex-1">
              {/* In combined "all managers" view there's no single manager to
                  set targets on, so suppress the per-manager call-to-action. */}
              {manager && (
                <NoActiveTargetBanner
                  viewAs={viewAs}
                  canSetTargets={canManageTargets}
                  onSet={() => setDialogOpen(true)}
                />
              )}
            </div>
          )}

          {canManageTargets && active && manager && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Target className="h-3.5 w-3.5 mr-1.5" />
              Manage targets
            </Button>
          )}
        </div>

        {/* Objective targets: recruited, selling, revenue, and weighted score. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            icon={TrendingUp}
            iconColor="text-[#00695C]"
            iconBg="bg-[#E0F2F1]"
            label="Associate Pros Recruited"
            actualDisplay={target.recruited_so_far.toLocaleString()}
            targetDisplay={
              target.recruited_target > 0
                ? target.recruited_target.toLocaleString()
                : undefined
            }
            percent={recruitedPct}
            tooltip="Associate Pros recruited by your team this period vs. active target."
          />

          <KpiTile
            icon={Briefcase}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            label="Selling Associate Pros"
            actualDisplay={target.selling_so_far.toLocaleString()}
            targetDisplay={
              target.selling_target > 0
                ? target.selling_target.toLocaleString()
                : undefined
            }
            percent={sellingPct}
            tooltip="Pros who made at least one sale this period vs. active target."
          />

          <KpiTile
            icon={CircleDollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            label="Revenue"
            actualDisplay={formatNairaShort(target.revenue_so_far)}
            targetDisplay={target.revenue_target > 0 ? formatNairaShort(target.revenue_target) : undefined}
            percent={revenuePct}
            tooltip={`Cash received this period on plans opened this period vs. active target. Currently ${formatNaira(target.revenue_so_far)}.`}
            noData={target.revenue_target === 0}
            noDataLabel="No revenue target set"
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
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-700"><Star className="h-4 w-4 text-amber-500" /><span>Peer rating</span></div>
          <div className="text-right"><span className="font-semibold tabular-nums">{score.rating_count > 0 ? score.actual.toFixed(2) : "No ratings yet"}</span><span className="text-gray-500 text-sm"> / 5.00</span><p className="text-xs text-gray-500">{score.rating_count.toLocaleString()} ratings this period</p></div>
        </div>
        {peerRatingPct !== undefined && <div className="h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(peerRatingPct, 100)}%` }} /></div>}
      </div>

      <ManageTargetsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        managerId={managerAdminId}
        managerName={managerDisplayName(manager)}
      />
    </>
  );
}

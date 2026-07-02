"use client";

import { useState } from "react";
import {
  TrendingUp,
  Briefcase,
  Star,
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
import type {
  AssociateManagerListItem,
  ManagerDashboardResponse,
} from "@/lib/gql/graphql";

interface Props {
  viewAs: "super-admin" | "manager";
  /** Active manager (from the managers list lookup). Null for manager view. */
  manager: AssociateManagerListItem | null;
  dashboard: ManagerDashboardResponse;
}

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

const formatPeriod = (period: ManagerDashboardResponse["period"]) => {
  if (period.periodType === "MONTH" && period.month && period.year) {
    return `${MONTHS[period.month - 1]} ${period.year}`;
  }
  if (period.periodType === "YEAR" && period.year) {
    return `${period.year}`;
  }
  if (period.periodType === "WEEK") {
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

const hasActiveTarget = (target: ManagerDashboardResponse["target"]) =>
  target.recruitedTarget > 0 ||
  target.sellingTarget > 0 ||
  target.performanceScoreTarget > 0;

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
  onSet,
}: {
  viewAs: Props["viewAs"];
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
      {viewAs === "super-admin" && (
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

const initialsOf = (m?: AssociateManagerListItem["manager"] | null) =>
  ((m?.firstName?.[0] ?? "") + (m?.lastName?.[0] ?? "")).toUpperCase() || "?";

const fullName = (m?: AssociateManagerListItem["manager"] | null) =>
  `${m?.firstName ?? ""} ${m?.lastName ?? ""}`.trim() ||
  m?.userName ||
  m?.email ||
  "Manager";

export function ManagerSnapshot({ viewAs, manager, dashboard }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const target = dashboard.target;
  const period = dashboard.period;
  const score = dashboard.performanceScore;
  const active = hasActiveTarget(target);
  const periodLabel = formatPeriod(period);
  const remaining = daysRemaining(period.end);

  const recruitedPct =
    target.recruitedTarget > 0
      ? (target.recruitedSoFar / target.recruitedTarget) * 100
      : undefined;
  const sellingPct =
    target.sellingTarget > 0
      ? (target.sellingSoFar / target.sellingTarget) * 100
      : undefined;
  // Rating scale is fixed at 1-5, so the ceiling for the performance score is
  // always 5.00. `performanceScoreTarget` from the manager's monthly config is
  // stale (came from the pre-rating scoring era where scores were 0-100), so
  // ignore it for the denominator here — the tile always renders X.XX / 5.00
  // and the progress bar is computed against 5.
  const RATING_MAX = 5;
  const scorePct =
    score.actual > 0 ? (score.actual / RATING_MAX) * 100 : undefined;

  const managerAdminId = manager?.manager?._id ?? null;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        {viewAs === "super-admin" && manager && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
              {initialsOf(manager.manager)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fullName(manager.manager)}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {manager.manager?.email}
                {" · "}
                {manager.associate_pros_count ?? 0} Pros assigned
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
                  onSet={() => setDialogOpen(true)}
                />
              )}
            </div>
          )}

          {viewAs === "super-admin" && active && manager && (
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

        {/* KPI tiles — 3 (reward descoped per blueprint §8) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiTile
            icon={TrendingUp}
            iconColor="text-[#00695C]"
            iconBg="bg-[#E0F2F1]"
            label="Associate Pros Recruited"
            actualDisplay={target.recruitedSoFar.toLocaleString()}
            targetDisplay={
              target.recruitedTarget > 0
                ? target.recruitedTarget.toLocaleString()
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
            actualDisplay={target.sellingSoFar.toLocaleString()}
            targetDisplay={
              target.sellingTarget > 0
                ? target.sellingTarget.toLocaleString()
                : undefined
            }
            percent={sellingPct}
            tooltip="Pros who made at least one sale this period vs. active target."
          />

          <KpiTile
            icon={Star}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            label="Performance Score"
            actualDisplay={score.actual.toFixed(2)}
            targetDisplay="5.00"
            percent={scorePct}
            tooltip="Average of realtor ratings for this period, out of 5."
            // Rating enum is 1-5, so an average of exactly 0 reliably means
            // "no ratings this period" rather than "everyone rated zero".
            noData={score.actual === 0}
            noDataLabel="No ratings yet this period"
          />
        </div>
      </div>

      <ManageTargetsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        managerId={managerAdminId}
        managerName={fullName(manager?.manager)}
      />
    </>
  );
}

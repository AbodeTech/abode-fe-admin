"use client";

import { useState } from "react";
import {
  TrendingUp,
  Briefcase,
  Star,
  Award,
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
  daysRemaining,
  formatPeriodLabel,
  getActiveTarget,
  type AssociateManager,
  type ManagerMetrics,
  type ManagerTarget,
} from "../mock-data";

interface Props {
  viewAs: "super-admin" | "manager";
  manager: AssociateManager;
  metrics: ManagerMetrics;
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatCurrencyShort = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(n);
};

type Tone = "exceeded" | "on-track" | "approaching" | "behind";

const toneFor = (pct: number): Tone => {
  if (pct >= 100) return "exceeded";
  if (pct >= 85) return "on-track";
  if (pct >= 50) return "approaching";
  return "behind";
};

const TONE_STYLES: Record<Tone, { bar: string; pillBg: string; pillText: string; label: string }> = {
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

interface KpiTileProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  actualDisplay: string;
  targetDisplay?: string;
  percent?: number;
  tooltip?: string;
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

      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold text-gray-900">{actualDisplay}</span>
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
    </div>
  );
}

function RewardTile({ amount }: { amount: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-[#E0F2F1]">
          <Award className="h-5 w-5 text-[#00695C]" />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              25% of (10 × Associate Pro Revenue) + 0.5% of total deposits.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="text-sm text-gray-600 mb-2">Performance Reward</p>

      <p className="text-2xl font-bold text-gray-900 mb-3">{formatCurrencyShort(amount)}</p>

      <p className="text-xs text-gray-500">{formatCurrency(amount)} · this period</p>
    </div>
  );
}

function ActiveTargetPill({ target }: { target: ManagerTarget }) {
  const remaining = daysRemaining(target);
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#E0F2F1] text-[#00695C] px-3 py-1.5 text-xs font-medium">
      <Target className="h-3.5 w-3.5" />
      Active target: {formatPeriodLabel(target)}
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

export function ManagerSnapshot({ viewAs, manager, metrics }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const active = getActiveTarget(manager.id);

  const recruitedActual = metrics.recruitment.newAssociatePros;
  const sellingActual = metrics.sales.sellingPros;
  const scoreActual = metrics.performance.score;

  const recruitedPct = active
    ? (recruitedActual / active.associateProsRecruited) * 100
    : undefined;
  const sellingPct = active
    ? (sellingActual / active.sellingAssociatePros) * 100
    : undefined;
  const scorePct = active ? (scoreActual / active.performanceScore) * 100 : undefined;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        {viewAs === "super-admin" && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
              {manager.avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{manager.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {manager.email} · {manager.assignedPros} Pros assigned
              </p>
            </div>
          </div>
        )}

        {/* Active target row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {active ? (
            <ActiveTargetPill target={active} />
          ) : viewAs === "super-admin" ? (
            <div className="flex-1">
              <NoActiveTargetBanner viewAs={viewAs} onSet={() => setDialogOpen(true)} />
            </div>
          ) : (
            <NoActiveTargetBanner viewAs={viewAs} onSet={() => setDialogOpen(true)} />
          )}

          {viewAs === "super-admin" && active && (
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Target className="h-3.5 w-3.5 mr-1.5" />
              Manage targets
            </Button>
          )}
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            icon={TrendingUp}
            iconColor="text-[#00695C]"
            iconBg="bg-[#E0F2F1]"
            label="Associate Pros Recruited"
            actualDisplay={recruitedActual.toLocaleString()}
            targetDisplay={active ? active.associateProsRecruited.toLocaleString() : undefined}
            percent={recruitedPct}
            tooltip="New Associate Pro upgrades this period vs. active target."
          />

          <KpiTile
            icon={Briefcase}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            label="Selling Associate Pros"
            actualDisplay={sellingActual.toLocaleString()}
            targetDisplay={active ? active.sellingAssociatePros.toLocaleString() : undefined}
            percent={sellingPct}
            tooltip="Pros who made at least one sale this period vs. active target."
          />

          <KpiTile
            icon={Star}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            label="Performance Score"
            actualDisplay={scoreActual.toFixed(2)}
            targetDisplay={active ? active.performanceScore.toFixed(2) : undefined}
            percent={scorePct}
            tooltip="Number of customer reviews ÷ average rating, vs. active target."
          />

          <RewardTile amount={metrics.performance.rewardAmount} />
        </div>
      </div>

      <ManageTargetsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        manager={manager}
        metrics={metrics}
      />
    </>
  );
}

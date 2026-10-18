"use client";

import { Banknote, CalendarDays, Gauge, Gift, Landmark, ShoppingBag, Ticket, Wallet } from "lucide-react";

import { formatNairaCompact, formatPercent } from "@/lib/utils/format";

import type { Campaign } from "../../schemas/campaign.schema";
import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";
import type { CampaignRevenue } from "../../schemas/revenue.schema";
import { formatDate } from "../../utils/format-period";
import { formatCount, formatNairaWhole, formatSqm } from "../../utils/format-metrics";
import { StatTile, StatTileSkeleton } from "./StatTile";

/** `formatNairaCompact` falls through to kobo under ₦1K — `₦0.00` reads as noise on an empty tile. */
const naira = (value: number) => (value === 0 ? "₦0" : formatNairaCompact(value));

function DaysTile({ period }: { period: CampaignDashboard["period"] }) {
  if (!period.has_started) {
    return (
      <StatTile
        icon={CalendarDays}
        label="Days left"
        value="Not started"
        note={`Runs ${formatDate(period.start_date)} – ${formatDate(period.end_date)}`}
      />
    );
  }
  if (period.has_ended) {
    return (
      <StatTile
        icon={CalendarDays}
        label="Days left"
        value="Ended"
        note={`Ran ${formatCount(period.total_days)} days, to ${formatDate(period.end_date)}`}
      />
    );
  }
  return (
    <StatTile
      icon={CalendarDays}
      label="Days left"
      value={`${formatCount(period.days_remaining)} ${period.days_remaining === 1 ? "day" : "days"}`}
      note={`Day ${formatCount(period.days_elapsed)} of ${formatCount(period.total_days)}`}
    >
      <div className="mt-2 h-1.5 w-full rounded-full bg-muted" aria-hidden>
        <div
          className="h-full rounded-full bg-foreground/70"
          style={{ width: `${Math.min(100, period.percent_elapsed * 100)}%` }}
        />
      </div>
    </StatTile>
  );
}

function PaceTile({ progress, period }: Pick<CampaignDashboard, "progress" | "period">) {
  const target = progress.total_sqm_target;
  let note = `to hit the target by ${formatDate(period.end_date)}`;
  if (!target) note = "No sqm target set";
  else if (progress.total_sqm_sold >= target) note = "Target reached";
  else if (period.has_ended) note = "Campaign has ended";

  return (
    <StatTile
      icon={Gauge}
      label="Needed per day"
      value={progress.daily_sqm_required != null ? formatSqm(Math.ceil(progress.daily_sqm_required)) : "—"}
      note={note}
    />
  );
}

export function CampaignKpiRow({
  campaign,
  data,
  isLoading,
}: {
  campaign: Pick<Campaign, "reward_type">;
  data?: Pick<CampaignDashboard, "period" | "progress" | "sales" | "issuance" | "participants">;
  isLoading?: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatTileSkeleton key={index} />
        ))}
      </div>
    );
  }

  const { period, progress, sales, issuance, participants } = data;
  const RewardIcon = campaign.reward_type === "ticket" ? Ticket : Gift;
  const rewardNote = [
    `${formatCount(participants.total_recipients)} ${participants.total_recipients === 1 ? "person" : "people"}`,
    issuance.invalidated_rewards > 0 ? `${formatCount(issuance.invalidated_rewards)} invalidated` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DaysTile period={period} />
      <PaceTile progress={progress} period={period} />
      <StatTile
        icon={ShoppingBag}
        label="Purchases"
        value={formatCount(sales.purchases)}
        note={`${formatCount(sales.buyers)} buyers · ${formatCount(issuance.purchases)} earned a reward`}
      />
      <StatTile
        icon={RewardIcon}
        label={campaign.reward_type === "ticket" ? "Tickets issued" : "Hampers issued"}
        value={formatCount(issuance.active_rewards)}
        note={rewardNote}
      />
    </div>
  );
}

/** Sales value — rendered only for admins who also hold view_sales. */
export function CampaignRevenueRow({
  data,
  isLoading,
  error,
}: {
  data?: CampaignRevenue;
  isLoading?: boolean;
  error?: Error | null;
}) {
  if (error) {
    return (
      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        Sales value is unavailable right now: {error.message}
      </p>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <StatTileSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile
        icon={Landmark}
        label="Value sold"
        value={naira(data.value_sold)}
        note={
          data.avg_price_per_sqm != null
            ? `${formatNairaWhole(data.avg_price_per_sqm)} per sqm on average`
            : "Nothing sold yet"
        }
      />
      <StatTile
        icon={Banknote}
        label="Collected"
        value={naira(data.amount_collected)}
        note={
          data.collected_percent != null
            ? `${formatPercent(data.collected_percent, 0)} of value sold`
            : "Nothing sold yet"
        }
      />
      <StatTile
        icon={Wallet}
        label="Outstanding"
        value={naira(data.balance_outstanding)}
        note="Still owed on plans that are running"
      />
    </div>
  );
}

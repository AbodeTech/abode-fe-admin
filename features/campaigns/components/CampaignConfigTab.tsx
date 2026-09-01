"use client";

import type { ReactNode } from "react";

import type { Campaign } from "../schemas/campaign.schema";
import { formatPeriod } from "../utils/format-period";
import { rewardTypeClassName } from "../utils/status-color";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="sm:col-span-2 text-sm">{value || "—"}</dd>
    </div>
  );
}

export function CampaignConfigTab({ campaign }: { campaign: Campaign }) {
  return (
    <div className="space-y-6 rounded-lg border p-4">
      <section className="space-y-3">
        <h2 className="font-semibold">Trigger</h2>
        <Row label="Event" value={campaign.trigger_event} />
        <Row label="Unit" value={campaign.trigger_unit} />
        <Row label="Mode" value={campaign.trigger_mode} />
        <Row label="Threshold" value={`${campaign.trigger_threshold} ${campaign.trigger_unit}`} />
        <Row label="Rewards per threshold" value={campaign.rewards_per_threshold} />
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Reward</h2>
        <Row
          label="Type"
          value={<span className={rewardTypeClassName(campaign.reward_type)}>{campaign.reward_type}</span>}
        />
        <Row
          label="Recipients"
          value={[campaign.recipient_buyer && "buyer", campaign.recipient_referrer && "referrer"]
            .filter(Boolean)
            .join(", ")}
        />
        {campaign.reward_type === "ticket" ? (
          <Row label="Ticket prefix" value={campaign.ticket_id_prefix} />
        ) : null}
        <Row label="Period" value={formatPeriod(campaign.start_date, campaign.end_date)} />
        <Row
          label="Target"
          value={
            campaign.total_sqm_target != null ? `${campaign.total_sqm_target.toLocaleString()} sqm` : "None"
          }
        />
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Eligibility</h2>
        <Row
          label="Buyer statuses"
          value={campaign.buyer_eligible_statuses.length ? campaign.buyer_eligible_statuses.join(", ") : "All"}
        />
        <Row
          label="Referrer statuses"
          value={
            campaign.referrer_eligible_statuses.length
              ? campaign.referrer_eligible_statuses.join(", ")
              : "All"
          }
        />
        <Row
          label="Asset types"
          value={
            campaign.eligible_asset_types?.length ? campaign.eligible_asset_types.join(", ") : "All"
          }
        />
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Checkpoints</h2>
        {(campaign.checkpoints ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No checkpoints defined.</p>
        ) : (
          <ul className="space-y-3">
            {(campaign.checkpoints ?? []).map((checkpoint) => (
              <li key={checkpoint.key} className="flex items-start gap-3 rounded-md border p-3">
                {checkpoint.prize_media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={checkpoint.prize_media_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="font-medium">{checkpoint.label}</p>
                  <p className="text-sm text-muted-foreground">{checkpoint.prize}</p>
                  <p className="text-xs text-muted-foreground">
                    {checkpoint.sqm_required.toLocaleString()} sqm · {checkpoint.key}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Leaderboard settings</h2>
        <Row
          label="Masking"
          value={campaign.leaderboard_masking_enabled === false ? "Off" : "On"}
        />
      </section>
    </div>
  );
}

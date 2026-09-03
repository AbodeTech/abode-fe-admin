"use client";

import { useFormContext } from "react-hook-form";

import type { CreateCampaignDto } from "../../schemas/create-campaign.schema";
import { formatPeriod } from "../../utils/format-period";

export function ReviewStep() {
  const { getValues } = useFormContext<CreateCampaignDto>();
  const values = getValues();

  return (
    <div className="space-y-3 rounded-lg border p-4 text-sm">
      <h2 className="font-semibold">Review</h2>
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Name</dt>
          <dd>{values.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Period</dt>
          <dd>{formatPeriod(values.start_date, values.end_date)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reward</dt>
          <dd className="capitalize">{values.reward_type}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Threshold</dt>
          <dd>
            {values.trigger_threshold} {values.trigger_unit} × {values.rewards_per_threshold} reward(s)
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Recipients</dt>
          <dd>
            {[values.recipient_buyer && "buyer", values.recipient_referrer && "referrer"].filter(Boolean).join(", ")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Target</dt>
          <dd>{values.total_sqm_target ? `${Number(values.total_sqm_target).toLocaleString()} sqm` : "None"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Leaderboard masking</dt>
          <dd>{values.leaderboard_masking_enabled ? "On" : "Off"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Checkpoints</dt>
          <dd>
            {values.checkpoints.length
              ? values.checkpoints.map((checkpoint) => checkpoint.label).join(", ")
              : "None"}
          </dd>
        </div>
      </dl>
      {values.description ? <p className="text-muted-foreground">{values.description}</p> : null}
    </div>
  );
}

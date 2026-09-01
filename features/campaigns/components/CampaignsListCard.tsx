"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

import type { Campaign } from "../schemas/campaign.schema";
import { campaignStatusClassName, rewardTypeClassName } from "../utils/status-color";
import { formatPeriod } from "../utils/format-period";

export function CampaignsListCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link href={`/campaigns/${campaign.id}`} className="block min-w-0">
      <Card className="min-w-0 overflow-hidden border-border bg-card transition-colors hover:bg-muted/30">
        <CardContent className="space-y-3 p-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-foreground">{campaign.name}</h2>
              <p className="text-sm text-muted-foreground">{formatPeriod(campaign.start_date, campaign.end_date)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={campaignStatusClassName(campaign.status)}>{campaign.status}</span>
              <span className={rewardTypeClassName(campaign.reward_type)}>{campaign.reward_type}</span>
              {campaign.is_legacy ? (
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">legacy</span>
              ) : null}
            </div>
          </div>
          {campaign.total_sqm_target != null && campaign.total_sqm_target > 0 ? (
            <p className="text-xs text-muted-foreground">
              Target {campaign.total_sqm_target.toLocaleString()} sqm
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

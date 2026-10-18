"use client";

import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useCampaignDashboard } from "../hooks/use-campaign-dashboard";
import { useCampaignRevenue } from "../hooks/use-campaign-revenue";
import type { Campaign } from "../schemas/campaign.schema";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { AssetBreakdownCard } from "./sections/AssetBreakdownCard";
import { CampaignKpiRow, CampaignRevenueRow } from "./sections/CampaignKpiRows";
import { CampaignTopEarnersSection } from "./sections/CampaignTopEarnersSection";
import { LandProgressCard } from "./sections/LandProgressCard";
import { SalesTimelineCard } from "./sections/SalesTimelineCard";

export function CampaignOverviewTab({
  campaign,
}: {
  campaign: Pick<Campaign, "id" | "reward_type" | "eligible_asset_types">;
}) {
  // Money is sales data: without view_sales the BE refuses it, so don't ask.
  const canViewSales = useAdminPermissions().has("view_sales");
  const { data, isLoading, error } = useCampaignDashboard(campaign.id);
  const revenue = useCampaignRevenue(campaign.id, { enabled: canViewSales });

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionErrorBoundary>
        <LandProgressCard campaign={campaign} data={data} isLoading={isLoading} />
      </SectionErrorBoundary>

      <SectionErrorBoundary>
        <CampaignKpiRow campaign={campaign} data={data} isLoading={isLoading} />
      </SectionErrorBoundary>

      {canViewSales ? (
        <SectionErrorBoundary>
          <CampaignRevenueRow data={revenue.data} isLoading={revenue.isLoading} error={revenue.error} />
        </SectionErrorBoundary>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <SectionErrorBoundary>
            <SalesTimelineCard data={data?.timeline} rewardType={campaign.reward_type} isLoading={isLoading} />
          </SectionErrorBoundary>
        </div>
        <div className="min-w-0 lg:col-span-2">
          <SectionErrorBoundary>
            <AssetBreakdownCard
              assets={data?.assets}
              revenue={canViewSales ? revenue.data?.assets : undefined}
              rewardType={campaign.reward_type}
              isLoading={isLoading}
            />
          </SectionErrorBoundary>
        </div>
      </div>

      <SectionErrorBoundary>
        <CampaignTopEarnersSection
          data={data?.top_earners}
          rewardType={campaign.reward_type}
          isLoading={isLoading}
        />
      </SectionErrorBoundary>
    </div>
  );
}

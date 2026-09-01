"use client";

import { useCampaignDashboard } from "../hooks/use-campaign-dashboard";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { CampaignIssuanceTimelineChart } from "./sections/CampaignIssuanceTimelineChart";
import { CampaignParticipantsSection } from "./sections/CampaignParticipantsSection";
import { CampaignPeriodSection } from "./sections/CampaignPeriodSection";
import { CampaignProgressSection } from "./sections/CampaignProgressSection";
import { CampaignTopEarnersSection } from "./sections/CampaignTopEarnersSection";

export function CampaignOverviewTab({ campaignId }: { campaignId: string }) {
  const { data, isLoading, error } = useCampaignDashboard(campaignId);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionErrorBoundary>
        <CampaignPeriodSection data={data?.period} isLoading={isLoading} />
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <CampaignProgressSection data={data?.progress} issuance={data?.issuance} isLoading={isLoading} />
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <CampaignParticipantsSection data={data?.participants} isLoading={isLoading} />
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <CampaignTopEarnersSection data={data?.top_earners} isLoading={isLoading} />
      </SectionErrorBoundary>
      <div className="lg:col-span-2">
        <SectionErrorBoundary>
          <CampaignIssuanceTimelineChart data={data?.timeline} isLoading={isLoading} />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}

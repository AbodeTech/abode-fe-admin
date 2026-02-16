"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAssociateProCampaign } from "@/features/campaigns/hooks/use-campaigns";
import { AssociateProMetricsSection, AssociateProUpgradesTable, AssociateProTopReferrersTable } from "@/features/campaigns/components/AssociateProComponents";

export default function Campaign2000AssociateProPage() {
  const { data: qData, isLoading, error } = useAssociateProCampaign();
  const data = qData as any;
  const dashboard = data?.getCampaignDashboard;
  const referral = data?.getReferralAnalytics;

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading campaign dashboard</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">2000 Associate Pro Campaign</h1>
          <p className="text-muted-foreground">
            Conversion and referral performance dashboard.
          </p>
        </div>
        <Badge variant="outline">Campaign Active</Badge>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading campaign data...
        </div>
      )}

      <AssociateProMetricsSection
        progressData={dashboard?.associateProProgress}
        revenueData={dashboard?.revenueMetrics}
        ticketData={dashboard?.ticketMetrics}
        conversionData={dashboard?.conversionMetrics}
      />

      <AssociateProUpgradesTable data={data?.getAssociateProUpgrades?.upgrades} />

      <AssociateProTopReferrersTable data={referral?.topReferrers?.topReferrers} />
    </div>
  );
}

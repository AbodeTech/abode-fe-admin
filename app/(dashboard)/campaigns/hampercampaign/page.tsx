"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useHamperCampaign } from "@/features/campaigns/hooks/use-campaigns";
import { HamperMetricsSection, HamperAssetTable, HamperReferrersTable, HamperLeaderboardSection, HamperTransactionTable } from "@/features/campaigns/components/HamperComponents";

export default function HamperCampaignPage() {
  const { data, isLoading, error } = useHamperCampaign();

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
          <h1 className="text-2xl font-bold tracking-tight">Hamper Campaign</h1>
          <p className="text-muted-foreground">
            Hamper issuance and sales performance.
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

      <HamperMetricsSection
        salesData={data?.salesMetrics}
        financialData={data?.financialMetrics}
      />

      <HamperAssetTable data={data?.assetBreakdown} />

      <HamperReferrersTable data={data?.referrersWithHampers} />

      <HamperLeaderboardSection />

      <HamperTransactionTable />
    </div>
  );
}

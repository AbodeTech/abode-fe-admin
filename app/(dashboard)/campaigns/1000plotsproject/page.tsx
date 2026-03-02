"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useRaffleCampaign } from "@/features/campaigns/hooks/use-campaigns";
import { RaffleMetricsSection, RaffleAssetTable, RaffleUsersTable, RaffleTicketsSection, RaffleTransactionTable } from "@/features/campaigns/components/RaffleComponents";

export default function Campaign1000PlotsPage() {
  const { data, isLoading, error } = useRaffleCampaign();

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
          <h1 className="text-2xl font-bold tracking-tight">1000 Plots Project</h1>
          <p className="text-muted-foreground">
            Land sales campaign performance and ticket distribution.
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

      <RaffleMetricsSection
        salesData={data?.salesMetrics}
        financialData={data?.financialMetrics}
      />

      <RaffleAssetTable data={data?.assetBreakdown} />

      <RaffleUsersTable data={data?.usersWithTickets} />

      <RaffleTicketsSection />

      <RaffleTransactionTable />
    </div>
  );
}

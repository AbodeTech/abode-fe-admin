"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useRaffleCampaign } from "@/features/campaigns/hooks/use-campaigns";
import { RaffleMetricsSection, RaffleAssetTable, RaffleUsersTable, RaffleTicketsSection, RaffleTransactionTable } from "@/features/campaigns/components/RaffleComponents";

export default function Campaign1000PlotsPage() {
  const { data, isLoading, error } = useRaffleCampaign();

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading campaign dashboard</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">1000 Plots Project</h1>
          <p className="text-muted-foreground">
            Land sales campaign performance and ticket distribution.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 self-start sm:self-auto">
          Campaign Active
        </Badge>
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

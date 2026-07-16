"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageContentLoader,
  SuspensePageFallback,
} from "@/components/shared/page-content-loader";
import { useRaffleCampaign } from "@/features/campaigns/hooks/use-campaigns";
import {
  RaffleMetricsSection,
  RaffleAssetMap,
  RaffleTicketMetricsCards,
  RaffleRecentTickets,
  RaffleTicketsSection,
  RaffleTransactionTable,
} from "@/features/campaigns/components/RaffleComponents";
import { PrizeFulfillmentTab } from "@/features/campaigns/components/PrizeFulfillmentTab";

function Campaign3000PlotsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";

  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data, isLoading, error } = useRaffleCampaign();

  if (error && tab === "overview") {
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
          <h1 className="text-2xl font-bold tracking-tight">3000 Plots Project</h1>
          <p className="text-muted-foreground">
            Land sales campaign performance and ticket distribution.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 self-start sm:self-auto">
          Campaign Active
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="min-w-0">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fulfillment">Prize fulfillment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {isLoading ? (
            <PageContentLoader label="Loading campaign data…" />
          ) : (
            <>
              <RaffleMetricsSection
                salesData={data?.salesMetrics}
                financialData={data?.financialMetrics}
                promoData={data?.promoDetails}
              />

              <RaffleAssetMap data={data?.assetBreakdown} />

              <RaffleTransactionTable />

              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Raffle &amp; Referral System
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ticket distribution and referral program metrics.
                  </p>
                </div>

                <RaffleTicketMetricsCards data={data?.ticketMetrics} />

                <RaffleTicketsSection />

                <RaffleRecentTickets data={data?.usersWithTickets} />
              </section>
            </>
          )}
        </TabsContent>

        <TabsContent value="fulfillment" className="mt-4">
          <PrizeFulfillmentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Campaign1000PlotsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <Campaign3000PlotsContent />
    </Suspense>
  );
}

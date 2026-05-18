"use client";

import Link from "next/link";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgencyDashboardPanels, useAgencyDashboard } from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";

export default function AgencyDashboardPage() {
  const { data, isLoading, error } = useAgencyDashboard();

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading agency dashboard</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Agency Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Overview of agency performance and metrics.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/agency/top-performing">Top Performing</Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/agency/transactions">Transactions</Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/agency/lists">View All Agencies</Link>
          </Button>
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/agency/new">
              <Plus className="mr-2 h-4 w-4" />
              Onboard Agency
            </Link>
          </Button>
        </div>
      </div>

      <AgencyDashboardPanels
        totalAgencies={data?.total_agencies}
        totalClientsRecruited={data?.total_clients_recruited}
        totalLandValueSold={data?.total_land_value_sold}
        outstandingBalance={data?.outstanding_balance}
        topPerformingAgencies={data?.top_performing_agencies}
        topSellingLands={data?.top_selling_lands}
      />
    </div>
  );
}

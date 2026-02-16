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
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading agency dashboard</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agency Dashboard</h1>
          <p className="text-muted-foreground">Overview of agency performance and metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/agency/top-performing">Top Performing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/agency/transactions">Transactions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/agency/lists">View All Agencies</Link>
          </Button>
          <Button asChild>
            <Link href="/agency/new">
              <Plus className="h-4 w-4 mr-2" />
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

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dashboard...
        </div>
      )}
    </div>
  );
}

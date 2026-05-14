"use client";

import {
  AgencyDashboardPanels,
  TopPerformingAgenciesTable,
  useAgencyDashboard,
} from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";
import { PageContentLoader } from "@/components/shared/page-content-loader";

export default function TopPerformingAgenciesPage() {
  const { data, isLoading, error } = useAgencyDashboard();

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading top agencies</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Top Performing Agencies</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Performance ranking based on client volume and sales value.
        </p>
      </div>

      {isLoading ? (
        <PageContentLoader label="Loading top agencies…" />
      ) : (
        <>
          <AgencyDashboardPanels
            totalAgencies={data?.total_agencies}
            totalClientsRecruited={data?.total_clients_recruited}
            totalLandValueSold={data?.total_land_value_sold}
            outstandingBalance={data?.outstanding_balance}
          />

          <TopPerformingAgenciesTable rows={data?.top_performing_agencies} />
        </>
      )}
    </div>
  );
}

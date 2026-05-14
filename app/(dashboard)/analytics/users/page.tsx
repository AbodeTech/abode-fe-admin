"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { UserAnalyticsAcquisition } from "@/features/users/components/analytics/UserAnalyticsAcquisition";
import { UserAnalyticsDemographics } from "@/features/users/components/analytics/UserAnalyticsDemographics";
import { UserAnalyticsConversion } from "@/features/users/components/analytics/UserAnalyticsConversion";

const USER_STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "User", value: "user" },
  { label: "Associate", value: "associate" },
  { label: "Associate Pro", value: "associate-pro" },
];

function UserAnalyticsContent() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const userStatus = searchParams.get("userStatus") || null;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-10 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[#101828]">User Analytics</h1>
          <p className="mt-1 text-sm text-[#667085]">
            Breakdown of user acquisition, demographics, and conversion.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <FilterSelect
            data={USER_STATUS_OPTIONS}
            queryKey="userStatus"
            placeholder="User Status"
          />
          <DateFilter />
        </div>
      </div>

      <UserAnalyticsAcquisition startDate={startDate} endDate={endDate} userStatus={userStatus} />
      <UserAnalyticsDemographics startDate={startDate} endDate={endDate} userStatus={userStatus} />
      <UserAnalyticsConversion startDate={startDate} endDate={endDate} userStatus={userStatus} />
    </div>
  );
}

export default function UserAnalyticsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <UserAnalyticsContent />
    </Suspense>
  );
}

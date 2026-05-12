"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";
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
    <div className="mt-4 space-y-10">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">User Analytics</h1>
          <p className="text-sm text-[#667085] mt-1">
            Breakdown of user acquisition, demographics, and conversion.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <UserAnalyticsContent />
    </Suspense>
  );
}

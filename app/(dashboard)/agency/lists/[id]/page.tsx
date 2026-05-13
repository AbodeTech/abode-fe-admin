"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AgencyDetailView, useAgency } from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";

export default function AgencyDetailPage() {
  const params = useParams();
  const agencyId = params?.id as string;

  const { data, isLoading, error } = useAgency(agencyId);

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading agency details</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  if (!isLoading && !data?.agency) {
    return (
      <div className="p-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        Agency not found.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <AgencyDetailView
        agency={data?.agency}
        statistics={data?.statistics}
        users={data?.agency?.referrals?.map((item) => item.user).filter((item): item is NonNullable<typeof item> => Boolean(item))}
        transactions={data?.agency?.transactions}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading agency details...
        </div>
      )}
    </div>
  );
}

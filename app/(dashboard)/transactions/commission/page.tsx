"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCommissionTransactions, CommissionTransactionsTable, CommissionExport } from "@/features/transactions";
import { Pagination } from "@/components/shared/Pagination";
import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";

function CommissionTransactionsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 100;
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const commissionSource = searchParams.get("commissionsource") || null;

  const { data, isLoading, error } = useCommissionTransactions({
    page,
    limit,
    startDate,
    endDate,
    commissionSource: commissionSource === "all" ? null : commissionSource,
  });

  const transactions = data?.data;
  const totalCount = data?.count || 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-[#333333]">Central Commission Table</h1>
          <p className="mt-0.5 text-sm text-[#667085]">View and manage all user commissions</p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <FilterSelect
            queryKey="commissionsource"
            placeholder="All Commission Sources"
            data={[
              { label: "All Commission Sources", value: "all" },
              { label: "Flex", value: "flex" },
              { label: "Full-Ownership", value: "full-ownership" },
              { label: "Upgrade", value: "upgrade" },
            ]}
          />
          <CommissionExport />
          <DateFilter />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {(error as Error).message ?? "Unable to load commission transactions"}
        </div>
      )}

      {/* Table Section */}
      <div className="min-w-0 overflow-hidden rounded-lg border border-[#E5EAEF] bg-white">
        <div className="min-w-0 overflow-x-auto">
          <CommissionTransactionsTable data={transactions} isLoading={isLoading} />
        </div>

        {!isLoading && totalCount > 0 && (
          <div className="border-t border-[#E5EAEF] px-4 py-4 sm:px-6">
            <Pagination count={totalCount} currentIdx={page} limit={limit} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommissionTransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <CommissionTransactionsContent />
    </Suspense>
  );
}

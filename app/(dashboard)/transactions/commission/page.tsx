"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCommissionTransactions, CommissionTransactionsTable, CommissionExport } from "@/features/transactions";
import { Pagination } from "@/components/shared/Pagination";
import { DateFilter } from "@/components/shared/DateFilter";

function CommissionTransactionsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 100;
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;

  const { data, isLoading, error } = useCommissionTransactions({ page, limit, startDate, endDate });

  const transactions = data?.data;
  const totalCount = data?.count || 0;

  return (
    <div className="mt-4 space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#333333]">Central Commission Table</h1>
          <p className="text-sm text-[#667085] mt-0.5">View and manage all user commissions</p>
        </div>
        <div className="flex items-center gap-3">
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
      <div className="bg-white border border-[#E5EAEF] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <CommissionTransactionsTable data={transactions} isLoading={isLoading} />
        </div>

        {!isLoading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-[#E5EAEF]">
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

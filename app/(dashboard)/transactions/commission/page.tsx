"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import {
  CommissionExport,
  CommissionTransactionsTable,
  DEFAULT_COMMISSION_TRANSACTIONS_LIMIT,
  useCommissionTransactions,
} from "@/features/transactions";

function CommissionTransactionsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = DEFAULT_COMMISSION_TRANSACTIONS_LIMIT;
  const from = searchParams.get("start_date") || null;
  const to = searchParams.get("end_date") || null;
  const sourceType = searchParams.get("commissionsource") || null;

  const { data, isLoading, error } = useCommissionTransactions({
    page,
    limit,
    from,
    to,
    source_type: sourceType === "all" ? null : sourceType,
  });

  const transactions = data?.items;
  const totalCount = data?.meta.total ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
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
              { label: "Direct", value: "direct" },
              { label: "Upline", value: "upline" },
              { label: "Topline", value: "topline" },
              { label: "Agency", value: "agency" },
              { label: "Founder", value: "founder" },
              { label: "WHT", value: "wht" },
            ]}
          />
          <CommissionExport />
          <DateFilter />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {(error as Error).message ?? "Unable to load commission transactions"}
        </div>
      )}

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
    <Suspense fallback={<SuspensePageFallback />}>
      <CommissionTransactionsContent />
    </Suspense>
  );
}

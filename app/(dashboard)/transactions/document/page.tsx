"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useDocumentTransactions, DocumentTransactionsTable } from "@/features/transactions";
import { TransactionDataPoints } from "@/components/shared/TransactionDataPoints";
import { Pagination } from "@/components/shared/Pagination";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

function DocumentTransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const status = searchParams.get("transactionstatus") || null;
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = searchParams.get("search") || "";

      if (searchTerm !== currentSearch) {
        if (searchTerm) {
          params.set("search", searchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, router, searchParams]);

  const { data, isLoading, error } = useDocumentTransactions({ page, limit, status, startDate, endDate });

  const transactions = data?.data;
  const totalCount = data?.count || 0;

  return (
    <div className=" mt-4 space-y-4">
      {/* Search Bar */}
      <div className="relative bg-white max-w-2xl">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for user by firstname, lastname or email"
          className="pl-8 h-11 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <FilterSelect
          data={[
            { label: "All Transactions Status", value: "all" },
            { label: "Approved", value: "completed" },
            { label: "Rejected", value: "failed" },
            { label: "Pending", value: "pending" },
          ]}
          queryKey="transactionstatus"
          placeholder="Status"
        />
        <DateFilter />
      </div>

      {/* Title */}
      <h3 className="font-sans font-semibold text-[#333333] text-xl uppercase">
        Document / Development Transactions
      </h3>

      {error && (
        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-600">
          {(error as Error).message ?? "Unable to load document transactions"}
        </div>
      )}

      {/* Statistics Cards */}
      <TransactionDataPoints type="document" />

      {/* Transaction Table */}
      <div className="bg-white border border-[#E5EAEF] rounded-md overflow-hidden pb-10">
        <DocumentTransactionsTable data={data?.data} isLoading={isLoading} filterQuery={searchTerm} />

        {!isLoading && totalCount > 0 && (
          <div className="mt-6 px-4">
            <Pagination count={totalCount} currentIdx={page} limit={limit} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentTransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <DocumentTransactionsContent />
    </Suspense>
  );
}
